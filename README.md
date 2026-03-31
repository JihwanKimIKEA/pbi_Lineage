# PBIP Lineage Explorer

Trace Power BI lineage from **Visual → Measure → Source Column** — including Power Query renames, field parameters, and calculation groups. Open your PBIP folder and get instant lineage tracing + commit-by-commit change intelligence.

[![Try Live Demo](https://img.shields.io/badge/Try%20Live%20Demo-▶%20Open%20in%20Browser-28a745?style=for-the-badge&logo=powerbi)](https://jihwankimikea.github.io/pbi_Lineage/)

Free · 100% client-side · Your files never leave your browser · [MIT License](LICENSE)

---

## What This Does

You point it at a PBIP project folder. It parses every `.tmdl`, `visual.json`, `page.json`, `definition.pbir`, and `expressions.tmdl` — then builds a complete lineage graph: which visuals reference which measures, which measures reference which columns, where those columns come from in the source system, and what Power Query renamed along the way.

It also scans git history to show what changed between commits — measures modified, visuals added/removed, filters changed, relationships altered — and traces the downstream impact of each change.

Everything runs client-side. Nothing is uploaded.

---

## Supported PBIP Structure

```
ProjectRoot/
├── ReportName.Report/
│   ├── definition.pbir                    # semantic model reference
│   └── definition/
│       └── pages/
│           └── <pageId>/
│               ├── page.json
│               └── visuals/
│                   └── <visualId>/
│                       └── visual.json
└── ModelName.SemanticModel/
    └── definition/
        ├── expressions.tmdl               # M expressions + parameters
        ├── relationships.tmdl             # table relationships
        └── tables/
            └── <TableName>.tmdl           # one file per table
```

The tool reads `definition.pbir` to resolve the semantic model path (`datasetReference.byPath.path`). If you select a `.Report` folder directly, it extracts the model reference and prompts you to select the `.SemanticModel` folder.

---

## Quick Start

### Browser

1. Open **[jihwankimikea.github.io/pbi_Lineage](https://jihwankimikea.github.io/pbi_Lineage/)** (Chrome/Edge 86+)
2. Click **Open Project Folder** — select the folder containing your `.Report` and `.SemanticModel` subfolders
3. Or **drag and drop** the folder onto the welcome screen
4. Click any measure or visual in the sidebar to trace lineage

You can also select a `.Report` folder directly — the tool reads `definition.pbir`, extracts the model name, and prompts you to pick the `.SemanticModel` folder.

> **No PBIP file?** Click **Try Sample Project** to explore with built-in sample data.

### VS Code Extension

1. Search **"PBIP Lineage Explorer"** in the Extensions marketplace
2. Auto-activates when your workspace contains `.tmdl` files
3. Click any measure in the **PBIP Lineage** sidebar to trace lineage in a webview panel
4. CodeLens annotations appear above each `measure` definition showing dependency and consumer counts

---

## Core Features

### Lineage Tracing

Click a measure → see the full DAX dependency tree rendered as an interactive D3.js graph. Every referenced measure, column, and table is traced recursively. The DAX expression is syntax-highlighted inline.

Click a visual → see **every** measure and column that visual references, aggregated across all data roles (values, axis, legend, filters, tooltips). Source columns are resolved through the entire chain — including Power Query renames from `Table.RenameColumns`.

**What gets resolved:**

| Layer | Detail |
|-------|--------|
| Visual → Measures | All measures from `prototypeQuery.Select`, `queryState`, `dataRoleBindings`, `filterConfig`, `vcObjects`, and `dataTransforms` |
| Measure → Measures | DAX refs: `[MeasureName]` and `'Table'[Measure]`, including `USERELATIONSHIP` columns |
| Measure → Columns | `'Table'[Column]` refs in DAX |
| Column → Source Column | `sourceColumn` field + `Table.RenameColumns` mappings from M expressions |
| Source Column → Source Table | `extractMDataSource()` resolves connection info from M expressions |

### Field Parameters

Field parameters are detected via:
- `NAMEOF('Table'[Field])` patterns in partition source expressions
- `extendedProperty ParameterMetadata` annotations on columns
- `SWITCH(SELECTEDVALUE(...))` measures

When a visual references a field parameter, the lineage shows **all** measures that the parameter can resolve to — not just the currently selected one. Field parameter display names (from the DAX row definitions) are preserved.

### Calculation Groups

Calculation groups are detected via the `calculationGroup` property or `CALCULATIONGROUP()` function reference. Each calculation item (YTD, QTD, MTD, etc.) is shown with its DAX expression. When a visual references a calculation group column, the lineage traces through all calculation items.

### Source Column Mapping

The **Source Map** view (toolbar button) shows a flat, searchable, sortable table:

| DAX Measure | PBI Table | PBI Column | Source Column | Source Table | Source Type |
|-------------|-----------|------------|---------------|--------------|-------------|

Columns that were renamed by Power Query are highlighted. Export as CSV or copy to clipboard.

**Supported data source types:**

| M Expression Pattern | Detected Type |
|----------------------|---------------|
| `Sql.Database("server", "db")` | SQL |
| `Sql.Database` with `.fabric.microsoft.com` | Fabric/Lakehouse |
| `GoogleBigQuery.Database(...)` | BigQuery |
| `Value.NativeQuery(...)` with FROM clause | BigQuery |
| `Web.Contents("url")` | Web |
| `Excel.Workbook(...)` | Excel |
| `Csv.Document(...)` / `File.Contents(...)` | CSV / File |

BigQuery parsing handles both schema navigation (`Source{[Name="project"]}[Data]{[Name="dataset", Kind="Schema"]}[Data]{[Name="table"]}`) and `Value.NativeQuery` with concatenated SQL strings (`` & _BillingProject & ".dataset.table`" ``). Parameters from `expressions.tmdl` are substituted before extraction.

### Impact Analysis

Select any node → click **Impact** → see upstream and downstream dependencies via BFS traversal. Grouped by type: Visuals → Measures → Columns → Tables → Sources. Click any item to navigate to it. Export as Markdown.

### Page Layout View

Click a page → see a scaled minimap of all visuals positioned as they appear in Power BI. Visuals are color-coded by type (chart, table, card, filter, slicer, text), labeled with type abbreviations and field counts. Hidden visuals and group containers are excluded. Click any visual rectangle to trace its lineage.

### Model Health Dashboard

**Health** button in the toolbar shows:
- Summary cards: measures, orphan measures, tables, columns, visuals, pages, relationships, data sources
- Orphan measures list (click to trace)
- Data sources table: type, server, database, table count
- Relationships table: from/to tables, cross-filter direction

### Bulk Export

**Export All** button generates a CSV with every measure's full lineage chain:

```
Measure, Table, DAX Expression, PBI Table, PBI Column, Data Type, Hidden,
Source Column, Source Table, Mode, Renamed, Used By Visuals
```

---

## Change Intelligence

After loading a project, the tool asynchronously scans git history and reports what changed between commits.

**30+ change types across 8 scopes:**

| Scope | Example Changes |
|-------|-----------------|
| Page | Added, removed, renamed, reordered, default page changed |
| Visual | Added, removed, type changed, title changed, measures changed, filters changed |
| Filter | Added, removed, conditions changed (page-level and visual-level) |
| Measure | Expression changed, added, removed |
| Bookmark | Added, removed |
| Column | Added, removed, type changed |
| Relationship | Added, removed, property changed |
| Source Expression | M query modified, data source changed |
| Calculation Item | Added, removed, expression modified |

Each change includes downstream impact — when a measure changes, the tool traces through direct references, field parameters, and calculation groups to show every affected visual.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `?` | Toggle keyboard help |
| `Escape` | Close Source Map / Impact Panel / overlays |
| `Alt + ←` | Navigate back |
| `↑` / `↓` | Navigate sidebar items |
| `Enter` | Trace selected item |

---

## Deep Links

URL hash parameters for bookmarking specific views:

```
#measure=measure::Sales.Total%20Sales
#visual=visual::abc123
#page=Page%201
```

---

## VS Code Extension Features

| Feature | Description |
|---------|-------------|
| **Sidebar: Measures** | All measures grouped by table, orphan badges, click to trace |
| **Sidebar: Orphans** | Measures not referenced by any visual |
| **Sidebar: Stats** | Table / measure / visual / relationship counts |
| **Sidebar: Changes** | Git history grouped by commit → scope → change with impact badges |
| **CodeLens on .tmdl** | `X deps | Y consumers` above each measure definition; `orphan` warning if unused |
| **Webview Panel** | Lineage tree, consuming visuals, column dependencies, source mapping |
| **File Watcher** | Auto-reloads on `.tmdl` changes; auto-scans git on commit/checkout |
| **Status Bar** | Measure count + orphan count; click for Model Health |

**Commands:**
- `PBIP: Trace Measure Lineage`
- `PBIP: Find Orphan Measures`
- `PBIP: Show Model Health`
- `PBIP: Refresh Lineage`
- `PBIP: Scan Recent Changes`

---

## Browser Requirements

| Browser | Support |
|---------|---------|
| Chrome 86+ | Full support (File System Access API) |
| Edge 86+ | Full support |
| Firefox | Partial — uses `<input webkitdirectory>` fallback (no drag-and-drop folder access) |
| Safari | Partial — same fallback |

---

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture, local setup, testing, and contribution guidelines.

```bash
npm install
npm run dev          # start dev server at localhost:5173
npm test             # run all tests (vitest)
npm run build        # production build
```

---

## License

[MIT](LICENSE)
