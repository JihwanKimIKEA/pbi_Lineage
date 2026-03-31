import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { identifyProjectStructure, analyze, findOrphans, traceMeasureLineage, traceVisualLineage, extractMDataSource, detectFieldParameter, buildGraph, parseTmdlModel, parseDaxExpression } from '../src/index.js';

/**
 * Integration test: load the sample PBIP project and run full analysis.
 */
describe('analyze (integration)', () => {
  let modelFiles;
  let reportFiles;

  beforeAll(() => {
    // Read sample PBIP files from disk
    const sampleRoot = join(__dirname, '../../../public/sample-pbip');
    modelFiles = readFilesRecursive(join(sampleRoot, 'definition'), '');
    reportFiles = readFilesRecursive(join(sampleRoot, 'report/definition'), '');
  });

  it('parses the sample project without errors', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);

    const result = analyze({ modelStructure, reportStructure });

    expect(result.graph).toBeDefined();
    expect(result.graph.nodes).toBeInstanceOf(Map);
    expect(result.graph.edges).toBeInstanceOf(Array);
    expect(result.stats).toBeDefined();
  });

  it('finds measures in the graph', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);
    const { graph } = analyze({ modelStructure, reportStructure });

    const measures = [...graph.nodes.values()].filter(n => n.type === 'measure');
    expect(measures.length).toBeGreaterThan(0);

    // Check specific known measures from the sample
    const totalSales = measures.find(m => m.name === 'Total Sales');
    expect(totalSales).toBeDefined();
  });

  it('finds tables and columns', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const { graph } = analyze({ modelStructure });

    const tables = [...graph.nodes.values()].filter(n => n.type === 'table');
    const columns = [...graph.nodes.values()].filter(n => n.type === 'column');

    expect(tables.length).toBeGreaterThan(0);
    expect(columns.length).toBeGreaterThan(0);

    // Sales table should exist
    const salesTable = tables.find(t => t.name === 'Sales');
    expect(salesTable).toBeDefined();
  });

  it('detects orphan measures', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);
    const { graph } = analyze({ modelStructure, reportStructure });

    const orphanIds = findOrphans(graph);
    // findOrphans returns an array of node IDs (strings)
    expect(Array.isArray(orphanIds)).toBe(true);
    // All orphan IDs should resolve to measure nodes
    for (const id of orphanIds) {
      const node = graph.nodes.get(id);
      expect(node).toBeDefined();
      expect(node.type).toBe('measure');
    }
  });

  it('traces measure lineage', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);
    const { graph } = analyze({ modelStructure, reportStructure });

    // Find Total Sales measure
    const totalSales = [...graph.nodes.values()].find(n => n.name === 'Total Sales' && n.type === 'measure');
    expect(totalSales).toBeDefined();

    const lineage = traceMeasureLineage(totalSales.id, graph);
    expect(lineage).toBeDefined();
    expect(lineage.measureChain).toBeDefined();
    expect(lineage.measureChain.name).toBe('Total Sales');
  });

  it('computes stats correctly', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);
    const { stats } = analyze({ modelStructure, reportStructure });

    expect(stats.tables).toBeGreaterThan(0);
    expect(stats.measures).toBeGreaterThan(0);
    expect(stats.columns).toBeGreaterThan(0);
  });

  it('captures field parameter display names', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);
    const { graph } = analyze({ modelStructure, reportStructure });

    // The Sales Metrics FP table should have display names
    const fpTable = graph.nodes.get("table::Sales Metrics");
    expect(fpTable).toBeDefined();
    expect(fpTable.enrichment?.type).toBe('field_parameter');

    // Check that fpDisplayNames are stored on the table metadata
    const displayNames = fpTable.metadata?.fpDisplayNames;
    expect(displayNames).toBeDefined();
    expect(displayNames["measure::Sales.Total Sales"]).toBe("sales_kpi_01");
    expect(displayNames["measure::Sales.Avg Sales"]).toBe("sales_kpi_02");
    expect(displayNames["measure::Sales.Total Quantity"]).toBe("sales_kpi_03");
  });

  it('includes description in measure metadata', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const { graph } = analyze({ modelStructure });

    // All measure nodes should have description field in metadata (even if empty)
    const measures = [...graph.nodes.values()].filter(n => n.type === 'measure');
    for (const m of measures) {
      expect(m.metadata).toHaveProperty('description');
    }
  });

  it('resolves source table and columns via named expressions', () => {
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);
    const { graph } = analyze({ modelStructure, reportStructure });

    // Sales table should have data source metadata from expressions.tmdl
    const salesTable = graph.nodes.get('table::Sales');
    expect(salesTable).toBeDefined();
    expect(salesTable.metadata.dataSource).toBeDefined();
    expect(salesTable.metadata.dataSource.sourceTable).toBe('fact_sales');
    expect(salesTable.metadata.dataSource.schema).toBe('dbo');

    // Amount column should have source column info resolved
    const amountCol = graph.nodes.get('column::Sales.Amount');
    expect(amountCol).toBeDefined();
    expect(amountCol.metadata.sourceColumn).toBe('Amount');
    expect(amountCol.metadata.sourceTablePath).toBe('mydb.dbo.fact_sales');

    // Columns should have rename info from the expression's Table.RenameColumns
    expect(amountCol.metadata.originalSourceColumn).toBe('sale_amount');
    expect(amountCol.metadata.wasRenamed).toBe(true);
    expect(amountCol.metadata.sourceTableFull).toBe('mydb.dbo.fact_sales.sale_amount');

    // Trace lineage and verify source table appears in output
    const totalSales = [...graph.nodes.values()].find(n => n.name === 'Total Sales' && n.type === 'measure');
    const lineage = traceMeasureLineage(totalSales.id, graph);
    expect(lineage.sourceTable.length).toBeGreaterThan(0);

    const amountRow = lineage.sourceTable.find(r => r.pbiColumn === 'Amount');
    expect(amountRow).toBeDefined();
    expect(amountRow.sourceTable).toContain('fact_sales');
    expect(amountRow.originalSourceColumn).toBe('sale_amount');
    expect(amountRow.renamed).toBe(true);
  });
});

describe('traceVisualLineage – calculation groups', () => {
  let graph;

  beforeAll(() => {
    const sampleRoot = join(__dirname, '../../../public/sample-pbip');
    const modelFiles = readFilesRecursive(join(sampleRoot, 'definition'), '');
    const reportFiles = readFilesRecursive(join(sampleRoot, 'report/definition'), '');
    const modelStructure = identifyProjectStructure(modelFiles);
    const reportStructure = identifyProjectStructure(reportFiles);
    ({ graph } = analyze({ modelStructure, reportStructure }));
  });

  it('traceVisualLineage returns a calculationGroups array', () => {
    // Pick any visual node
    const anyVisual = [...graph.nodes.values()].find(n => n.type === 'visual');
    expect(anyVisual).toBeDefined();

    const result = traceVisualLineage(anyVisual.id, graph);
    expect(result).toBeDefined();
    expect(Array.isArray(result.calculationGroups)).toBe(true);
  });

  it('visual referencing TimeCalcGroup has calculationGroups with tableName and items', () => {
    // visual5 references TimeCalcGroup.Name column
    const visual5 = [...graph.nodes.values()].find(
      n => n.type === 'visual' && (n.name === 'visual5' || n.metadata?.title === 'YoY Growth Trend')
    );
    expect(visual5).toBeDefined();

    const result = traceVisualLineage(visual5.id, graph);
    expect(result.calculationGroups.length).toBeGreaterThan(0);

    const tcg = result.calculationGroups.find(cg => cg.tableName === 'TimeCalcGroup');
    expect(tcg).toBeDefined();
    expect(tcg.tableName).toBe('TimeCalcGroup');
    expect(Array.isArray(tcg.items)).toBe(true);
    expect(tcg.items.length).toBeGreaterThan(0);
  });

  it('each CG item has name and expression', () => {
    const visual5 = [...graph.nodes.values()].find(
      n => n.type === 'visual' && (n.name === 'visual5' || n.metadata?.title === 'YoY Growth Trend')
    );
    const result = traceVisualLineage(visual5.id, graph);
    const tcg = result.calculationGroups.find(cg => cg.tableName === 'TimeCalcGroup');

    for (const item of tcg.items) {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('expression');
      expect(typeof item.name).toBe('string');
      expect(typeof item.expression).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.expression.length).toBeGreaterThan(0);
    }

    // Verify specific CG items from TimeCalcGroup
    const itemNames = tcg.items.map(i => i.name);
    expect(itemNames).toContain('YTD');
    expect(itemNames).toContain('QTD');
    expect(itemNames).toContain('MTD');
  });

  it('visual without CG reference returns empty calculationGroups array', () => {
    // visual1 (Sales by Category) does not reference any CG
    const visual1 = [...graph.nodes.values()].find(
      n => n.type === 'visual' && (n.name === 'visual1' || n.metadata?.title === 'Sales by Category')
    );
    expect(visual1).toBeDefined();

    const result = traceVisualLineage(visual1.id, graph);
    expect(result.calculationGroups).toEqual([]);
  });
});

describe('extractMDataSource', () => {
  it('handles concatenated SQL in Value.NativeQuery', () => {
    const mExpr = `let
    Source = Value.NativeQuery(GoogleBigQuery.Database([BillingProject=_BillingProject]), "SELECT * FROM \`" & _BillingProject & ".report_business_units.business_unit_cur_func_dim\` ('" & _ReportId & "')", null, [EnableFolding=true])
in
    Source`;
    const ds = extractMDataSource(mExpr);
    expect(ds.sourceTable).toBe('business_unit_cur_func_dim');
    expect(ds.database).toBe('report_business_units');
  });

  it('extracts BillingProject from resolved options', () => {
    const mExpr = `let
    Source = Value.NativeQuery(GoogleBigQuery.Database([UseStorageApi=false, BillingProject="ingka-ilo-ia-prod"]){[Name="ingka-ilo-ia-prod"]}[Data], "SELECT * FROM \`" & "ingka-ilo-ia-prod" & ".report_date.date_func_dim\`", null, [EnableFolding=true])
in
    Source`;
    const ds = extractMDataSource(mExpr);
    expect(ds.type).toBe('BigQuery');
    expect(ds.server).toBe('ingka-ilo-ia-prod');
    expect(ds.database).toBe('report_date');
    expect(ds.sourceTable).toBe('date_func_dim');
  });

  it('handles BigQuery schema navigation after parameter resolution', () => {
    const mExpr = `let
    Source = GoogleBigQuery.Database([BillingProject="ingka-ilo-ia-prod", UseStorageApi=false]),
    #"ingka-ilo-ia-prod" = Source{[Name="ingka-ilo-ia-prod"]}[Data],
    powerbi_fulfilment_Schema = #"ingka-ilo-ia-prod"{[Name="powerbi_fulfilment",Kind="Schema"]}[Data],
    checking_fct = powerbi_fulfilment_Schema{[Name="checking_correction_event_combined_fct",Kind="View"]}[Data]
in
    checking_fct`;
    const ds = extractMDataSource(mExpr);
    expect(ds.type).toBe('BigQuery');
    expect(ds.server).toBe('ingka-ilo-ia-prod');
    expect(ds.database).toBe('powerbi_fulfilment');
    expect(ds.sourceTable).toBe('checking_correction_event_combined_fct');
  });

  it('handles BigQuery with direct SQL string in Value.NativeQuery', () => {
    const mExpr = `let
    Source = Value.NativeQuery(GoogleBigQuery.Database([BillingProject="my-project"]), "SELECT * FROM \`my-project.my_dataset.my_table\`", null)
in
    Source`;
    const ds = extractMDataSource(mExpr);
    expect(ds.type).toBe('BigQuery');
    expect(ds.server).toBe('my-project');
    expect(ds.database).toBe('my_dataset');
    expect(ds.sourceTable).toBe('my_table');
  });

  it('handles Sql.Database with schema and item', () => {
    const mExpr = `let
    Source = Sql.Database("myserver.database.windows.net", "mydb"),
    dbo = Source{[Schema="dbo",Item="factSales"]}[Data]
in
    dbo`;
    const ds = extractMDataSource(mExpr);
    expect(ds.type).toBe('SQL');
    expect(ds.server).toBe('myserver.database.windows.net');
    expect(ds.database).toBe('mydb');
    expect(ds.schema).toBe('dbo');
    expect(ds.sourceTable).toBe('factSales');
  });

  it('returns null for empty or null expressions', () => {
    expect(extractMDataSource(null)).toBeNull();
    expect(extractMDataSource('')).toBeNull();
  });
});

describe('detectFieldParameter', () => {
  it('detects field parameter via NAMEOF in partition source', () => {
    const table = {
      name: 'prmMeasures',
      columns: [
        { name: 'prmMeasures', sourceColumn: '[Value1]' },
        { name: 'prmMeasures Fields', sourceColumn: '[Value2]', hasParameterMetadata: true },
        { name: 'prmMeasures Order', sourceColumn: '[Value3]' },
      ],
      measures: [{ name: 'prmMeasures', expression: 'SWITCH(SELECTEDVALUE(prmMeasures[prmMeasures Order]), 0, [Sales])' }],
      partitions: [{
        sourceExpression: '{ ("Sales Amount", NAMEOF(\'Sales\'[Amount]), 0), ("Product Count", NAMEOF(\'Products\'[Count]), 1) }'
      }],
    };
    const result = detectFieldParameter(table);
    expect(result.isFieldParam).toBe(true);
    expect(result.referencedFields.length).toBeGreaterThanOrEqual(2);
  });

  it('detects field parameter via ParameterMetadata fallback (no NAMEOF)', () => {
    const table = {
      name: 'prmTest',
      columns: [
        { name: 'Value', sourceColumn: '[Value1]' },
        { name: 'Fields', sourceColumn: '[Value2]', hasParameterMetadata: true },
      ],
      measures: [],
      partitions: [{ sourceExpression: '{ ("Field1", 0), ("Field2", 1) }' }],
    };
    const result = detectFieldParameter(table);
    expect(result.isFieldParam).toBe(true);
    expect(result.referencedFields).toHaveLength(0); // No NAMEOF = no field references
  });

  it('does not detect regular table as field parameter', () => {
    const table = {
      name: 'prmHour_dim',
      columns: [
        { name: 'time_sk', dataType: 'string', sourceColumn: 'time_sk' },
        { name: 'Hour', dataType: 'int64', sourceColumn: 'Hour' },
      ],
      measures: [],
      partitions: [{ sourceExpression: 'let Source = Hour in Source' }],
    };
    const result = detectFieldParameter(table);
    expect(result.isFieldParam).toBe(false);
  });

  it('returns safe defaults for null table', () => {
    const result = detectFieldParameter(null);
    expect(result.isFieldParam).toBe(false);
    expect(result.referencedFields).toEqual([]);
  });
});

describe('buildGraph — measure-to-measure edges after quoted table names', () => {
  it('resolves all unqualified [Measure] refs even after quoted table names appear', () => {
    // This reproduces the Picking Quality bug: [Number of Orders with Exception]
    // was not found because its [BracketRef] appeared after 'Business Unit'[...] in the expression,
    // and the old lookbehind regex was blocking it.
    const tmdl = `table Measure
\tmeasure 'Picking Quality' =
\t\tDIVIDE(
\t\tCALCULATE( [Number of Completed Orders],
\t\tFILTER( 'Business Unit', 'Business Unit'[Business Unit Type] = "STO" )
\t\t) - CALCULATE( [Number of Orders with Exception], FILTER( 'Business Unit', 'Business Unit'[Business Unit Type] = "STO" ) ),
\t\tCALCULATE( [Number of Completed Orders],
\t\tFILTER( 'Business Unit', 'Business Unit'[Business Unit Type] = "STO" )
\t\t)
\t\t)
\tmeasure 'Number of Completed Orders' = COUNTROWS('Order')
\tmeasure 'Number of Orders with Exception' = COUNTROWS(FILTER('Order', 'Order'[HasException] = TRUE()))

table 'Business Unit'
\tcolumn 'Business Unit Type'
\t\tdataType: string
\t\tsourceColumn: business_unit_type

table 'Order'
\tcolumn HasException
\t\tdataType: boolean
\t\tsourceColumn: has_exception`;

    const files = new Map([['tables/Measure.tmdl', tmdl]]);
    const model = parseTmdlModel(
      files.entries().map(([path, content]) => ({ path, content })).toArray
        ? [...files].map(([path, content]) => ({ path, content }))
        : [...files].map(([path, content]) => ({ path, content })),
      []
    );
    // Parse DAX
    for (const table of model.tables) {
      for (const measure of (table.measures || [])) {
        if (measure.expression) measure.daxDeps = parseDaxExpression(measure.expression);
      }
    }

    const graph = buildGraph(model, { pages: [], visuals: [] });

    // Find edges from Picking Quality
    const pqId = 'measure::Measure.Picking Quality';
    const pqEdges = graph.edges.filter(e => e.source === pqId);
    const targetIds = pqEdges.map(e => e.target);

    // Both measure refs must be found
    expect(targetIds).toContain('measure::Measure.Number of Completed Orders');
    expect(targetIds).toContain('measure::Measure.Number of Orders with Exception');
  });
});

/**
 * Recursively read files from a directory into a Map<string, string>.
 */
function readFilesRecursive(dirPath, basePath) {
  const files = new Map();
  let entries;
  try {
    entries = readdirSync(dirPath);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const relativePath = basePath ? `${basePath}/${entry}` : entry;
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const subFiles = readFilesRecursive(fullPath, relativePath);
      for (const [path, content] of subFiles) {
        files.set(path, content);
      }
    } else if (stat.isFile()) {
      const ext = entry.includes('.') ? '.' + entry.split('.').pop().toLowerCase() : '';
      if (['.tmdl', '.json', '.pbir', '.platform'].includes(ext)) {
        files.set(relativePath, readFileSync(fullPath, 'utf-8'));
      }
    }
  }

  return files;
}
