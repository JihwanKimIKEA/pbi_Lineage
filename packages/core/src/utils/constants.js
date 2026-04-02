export const NODE_TYPES = {
  TABLE: 'table',
  COLUMN: 'column',
  MEASURE: 'measure',
  VISUAL: 'visual',
  PAGE: 'page',
  SOURCE: 'source',
  EXPRESSION: 'expression',
};

export const NODE_COLORS = {
  table: '#005A9B',
  column: '#7B1FA2',
  measure: '#D47600',
  visual: '#2E7D32',
  page: '#00838F',
  source: '#5F6B6D',
  expression: '#5D4037',
};

export const NODE_LABELS = {
  table: 'Table',
  column: 'Column',
  measure: 'Measure',
  visual: 'Visual',
  page: 'Page',
  source: 'Source',
  expression: 'Expression',
};

export const EDGE_COLORS = {
  visual_to_field: '#2E7D32',
  visual_to_page: '#00838F',
  measure_to_measure: '#D47600',
  measure_to_column: '#7B1FA2',
  measure_to_userelationship: '#DA3D2A',
  column_to_table: '#005A9B',
  calc_column_to_column: '#8E24AA',
  calc_column_to_measure: '#E09400',
  table_relationship: '#546E7A',
  table_to_source: '#78909C',
  table_to_expression: '#5D4037',
  expression_to_source: '#795548',
  field_param_to_field: '#C2185B',
  column_to_source_column: '#607D8B',
};

export const EDGE_TYPES = {
  VISUAL_TO_FIELD: 'visual_to_field',
  MEASURE_TO_MEASURE: 'measure_to_measure',
  MEASURE_TO_COLUMN: 'measure_to_column',
  COLUMN_TO_TABLE: 'column_to_table',
  TABLE_RELATIONSHIP: 'table_relationship',
  VISUAL_TO_PAGE: 'visual_to_page',
  FIELD_PARAM_TO_FIELD: 'field_param_to_field',
  TABLE_TO_SOURCE: 'table_to_source',
  CALC_COLUMN_TO_COLUMN: 'calc_column_to_column',
  CALC_COLUMN_TO_MEASURE: 'calc_column_to_measure',
  MEASURE_TO_USERELATIONSHIP: 'measure_to_userelationship',
  TABLE_TO_EXPRESSION: 'table_to_expression',
  EXPRESSION_TO_SOURCE: 'expression_to_source',
  COLUMN_TO_SOURCE_COLUMN: 'column_to_source_column',
};

export const ENRICHMENT_TYPES = {
  FIELD_PARAMETER: 'field_parameter',
  CALCULATION_GROUP: 'calculation_group'
};

/** Colors for the 6-layer lineage tree visualization */
export const LAYER_COLORS = {
  visual: '#2E7D32',
  measure: '#D47600',
  subMeasure: '#E09400',
  column: '#7B1FA2',
  expression: '#5D4037',
  source: '#5F6B6D',
};

/** Labels for the 6 lineage layers */
export const LAYER_LABELS = {
  1: 'Report Visual',
  2: 'DAX Measure',
  3: 'DAX Sub-Measure',
  4: 'PBI Table & Column',
  5: 'Power Query',
  6: 'Source Connection',
};
