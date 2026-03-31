# Development Guide

This document consolidates architecture details, development setup, project structure, version history, and roadmap for PBIP Lineage Explorer.

---

## What This Is

PBIP Lineage Explorer — a browser-based tool that traces DAX measure lineage in Power BI PBIP projects. Also ships as a VS Code extension. 100% client-side, no server, files never leave the browser.

---

## Commands

```bash
npm install          # Install all workspace dependencies
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # Production build to dist/
npm run test         # Run core tests (vitest, one-shot)
npm run test:watch   # Run core tests in watch mode
```

VS Code extension (run from `packages/vscode/`):
```bash
npm run build        # esbuild bundle → out/extension.js
npm run watch        # esbuild watch mode
npm run package      # Create .vsix via vsce
```

Tests live in `packages/core/tests/` and cover the core analysis engine only. Test with sample data in `public/sample-pbip/`.

---

## Architecture

**Monorepo** with npm workspaces (`packages/*`):

- **`packages/core/`** — Platform-independent analysis engine. Accepts `Map<path, content>` and returns a lineage graph. Contains all parsers (TMDL, DAX, PBIR), graph builder, lineage tracer, and impact analysis. This is the shared logic used by both web and VS Code.
- **`src/`** (root) — Web app. Vanilla JS + D3.js, no framework. `main.js` orchestrates parsing via core, manages app state, and wires up UI components in `src/ui/`. Reads files via browser File System Access API (`src/parser/pbipReader.js`).
- **`packages/vscode/`** — VS Code extension. Reads files via workspace API (`vscodeReader.js`), uses core for analysis, renders lineage in a webview panel and tree views.

**Import alias**: `@pbip-lineage/core` resolves to `packages/core/src/` (configured in both `vite.config.js` and `vitest.config.js`).

### Core Pipeline (packages/core)

1. Parse TMDL → tables, columns, measures
2. Parse DAX expressions → dependency refs (measures, columns, tables)
3. Parse PBIR → visual configurations and field mappings
4. Detect enrichments (field parameters, calculation groups)
5. Build graph (nodes + edges) and compute stats

### Web App Data Flow

`handleOpenFolder()` → File System Access API → core `analyze()` → populate sidebar (measures/visuals) → user selects item → `traceMeasureLineage()` or `traceVisualLineage()` → render D3 tree + lineage detail view.

---

## Project Structure

```
src/
├── main.js              # App entry point and orchestration
├── parser/
│   ├── pbipReader.js    # File System Access API integration
│   ├── tmdlParser.js    # TMDL file parsing (tables, measures, columns)
│   ├── pbirParser.js    # PBIR visual configuration parsing
│   ├── daxParser.js     # DAX expression dependency extraction
│   └── enrichment.js    # Field parameter / calculation group detection
├── graph/
│   ├── graphBuilder.js  # Node/edge graph construction
│   ├── lineageTracer.js # Lineage tracing algorithms
│   └── impactAnalysis.js # Upstream/downstream impact analysis
├── ui/
│   ├── toolbar.js       # Toolbar with Open Project button
│   ├── measurePicker.js # Left sidebar measure list
│   ├── visualBrowser.js # Left sidebar visuals list
│   ├── lineageView.js   # Main lineage rendering + DAX highlighting
│   ├── lineageTree.js   # D3 tree visualization
│   └── sourceMapping.js # Source Column Mapping view
└── utils/
    └── constants.js     # Node/edge types and colors
```

---

## Key Constraints

- **Vanilla JS only** — no React/Vue/Angular. ES modules throughout.
- **Client-side only** — no server-side code, no network requests for data.
- **Dark theme** — single CSS file (`styles/main.css`) with CSS custom properties.
- **Browser requirement** — Chrome/Edge (File System Access API).
- **ESM** — `"type": "module"` in all package.json files.

---

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) auto-deploys `dist/` to GitHub Pages on push to `main`.

---

## Contributing

### Development Setup

```bash
git clone https://github.com/JihwanKimIKEA/pbi_Lineage.git
cd pbi_Lineage
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge (File System Access API required).

### Guidelines

- **No frameworks** — the app uses vanilla JS + ES modules + D3.js only
- **Client-side only** — no server-side code, no data uploads
- **Privacy first** — files are read locally via File System Access API
- **Dark theme** — all UI changes should work with the existing dark theme

### Pull Requests

1. Fork the repo and create a feature branch
2. Make your changes
3. Test with the sample PBIP in `public/sample-pbip/`
4. Run `npm run build` to verify the build succeeds
5. Submit a PR with a clear description of what changed and why

### Reporting Issues

Please include:
- Browser and version
- Description of your PBIP project structure (number of tables, measures, visuals)
- Steps to reproduce
- Screenshots if applicable

---

## Changelog

### [Unreleased]

#### Added
- **"Try Sample Project" button** — One-click demo with bundled sample PBIP project for first-time visitors
- **Impact Analysis panel** — Slide-over panel showing upstream/downstream dependencies for any measure, with export to Markdown
- **Model Health Dashboard** — Overview of model stats, orphan measures, data sources, and relationships
- **Import/DirectQuery mode badges** — Source lineage table and D3 tree now show storage mode (Import/DQ/Dual)
- **Circular reference warnings** — Red badge on circular measures, warning banner in lineage view, dashed border on tree nodes
- **SVG/PNG tree export** — Export D3 lineage tree as SVG or PNG with attribution watermark
- **Keyboard shortcut help** — `?` key opens popover listing all shortcuts; search placeholder shows `/` hint
- **Progressive disclosure** — DAX chain and source lineage sections collapse by default with summary counts
- **USERELATIONSHIP display** — Shows relationship pairs and cross-filter direction in DAX chain
- **Collapse/expand tree nodes** — Click nodes with children to toggle subtrees in D3 visualization
- **Session value counter** — Footer showing measures traced and columns mapped during session
- **Shareable lineage URLs** — Deep links via URL hash (`#measure=...`, `#visual=...`) so selections persist across page reloads
- **Drag-and-drop file loading** — Drop a PBIP project folder onto the welcome screen to load it (File System Access API + webkit fallback)
- **ARIA accessibility** — `role`, `aria-label`, `aria-selected`, `aria-live` attributes on toolbar, sidebar tabs, search inputs, panels, and overlays; `:focus-visible` rings on all interactive elements
- **JSON-LD structured data** — Schema.org SoftwareApplication metadata for search engine discovery
- **Inline SVG favicon** — Lineage graph icon in browser tab
- **Open Graph meta tags** — Social preview image for link sharing

### [1.0.0] — 2026-03-15

#### Added
- **DAX measure lineage tracing** — 4-section output: visuals, DAX chain, source lineage, summary trees
- **Visual lineage tracing** — Select a visual to see all measures it references (direct and via field parameters)
- **D3.js interactive tree** — Left-to-right tree with zoom, pan, and color-coded nodes by type
- **Field parameter support** — Detects FP tables, resolves display names, shows FP binding badges
- **Calculation group detection** — Identifies calculation groups and calculation items
- **Source column mapping** — Full-page source map view with table-to-source tracing
- **Page layout visualization** — Canvas-based page layout showing visual positions and types
- **TMDL parser** — Parses tables, columns, measures, relationships, expressions from `.tmdl` files
- **DAX expression parser** — Extracts measure, column, and table references from DAX expressions
- **PBIR parser** — Parses visual configurations, field mappings, and page layouts from PBIR JSON
- **Rename chain tracking** — Detects column renames across Power Query → model → source layers
- **USERELATIONSHIP detection** — Identifies activated relationships in DAX via `USERELATIONSHIP()` calls
- **Search** — `/` shortcut to filter measures and visuals in the sidebar
- **Keyboard navigation** — `Alt+Left` for back, `Escape` to close overlays
- **Report picker** — Select from multiple reports when a project contains several
- **Dark theme** — Single dark theme with CSS custom properties
- **VS Code extension** — Tree views for measures, visuals, and source mapping with webview lineage panel
- **100% client-side** — All processing in browser, files never leave the machine
- **GitHub Pages deployment** — Automated deploy via GitHub Actions

---

## Roadmap

### Priority Matrix

| Priority | Items | Rationale |
|----------|-------|-----------|
| **P1** | BigQuery parameter resolution, Hidden column/measure indicators, Data type badges, Bulk lineage export | High value, low-to-medium effort |
| **P2** | Full BigQuery display, M-based field parameter detection, Aggregation pattern awareness | Medium value, depends on P1 |
| **P3** | reportExtensions.json, BigQuery schema catalog, Incremental refresh indicator, Bookmark-aware lineage, Cross-report lineage, Measure description display, Relationship visualization | Lower priority or high effort |

### Planned Features

- **Command Palette (Ctrl+K)** — VS Code-style search across measures, visuals, pages, and tables simultaneously
- **Shareable Lineage Snapshots** — "Copy as Markdown" button for Confluence/ADO, enhanced PNG/SVG export
- **Keyboard-Driven Sidebar Navigation** — Arrow keys in sidebar, Enter to trace, Tab to switch tabs
- **Virtual Scrolling for Large Models** — Only render visible viewport items for 500+ measure models
- **Model Diff / Change Detection** — Load two PBIP folders, diff the graphs, show added/removed/modified measures
- **Calculation Group Lineage** — Enhance tracer to follow calculation group column references via SELECTEDVALUE patterns
- **Error Diagnostics Panel** — Collect parse warnings and display in Model Health Dashboard
- **Responsive Sidebar** — Collapsible at 1024px, overlay at 768px

### Downstream Lineage Enhancement Plan

#### Phase 1: Visual/Page Browser Sidebar Tab
- New `src/ui/visualBrowser.js` — two-level collapsible tree: Pages → Visuals
- Tab switcher in sidebar: "Measures" | "Visuals"
- Search filters by page name, visual title, or visual type

#### Phase 2: Visual-First Lineage Tracing
- `traceVisualLineage()` — traces all measures a visual uses (including field parameter resolution)
- `renderVisualLineage()` — combined lineage view for visual selections

#### Phase 3: Column Rename Chain Surfacing
- Show full 3-name chain (Source → PQ → PBI) when names differ between layers
- Visual indicators on D3 tree nodes for renamed columns

#### Phase 4: Richer Output Format
- Enhanced visuals section with Object ID column
- Full DAX expression in collapsible blocks with "Copy DAX" button
- Structured HTML summary tree with color-coded nodes by layer
- Bidirectional D3 tree: visual nodes → measure → upstream dependencies

### Implementation Order

```
Phase 1 (Visual Browser)  ─┐
                            ├── can be done in parallel
Phase 3 (Rename Chains)   ─┘

Phase 2 (Visual-First Tracing) ── depends on Phase 1

Phase 4 (Richer Output)        ── depends on Phases 1-2 for full context
```

### Key Files to Modify

| File | Changes |
|------|---------|
| `src/ui/visualBrowser.js` | **NEW** — visual/page browser sidebar |
| `src/graph/lineageTracer.js` | Add `traceVisualLineage()`, enhance `traceVisuals()` for FP, enhance `buildSourceTable()` for rename chains |
| `src/ui/lineageView.js` | Add `renderVisualLineage()`, enhance all 4 section renderers |
| `src/ui/lineageTree.js` | Add downstream nodes to D3 tree, rename indicators on column nodes |
| `src/main.js` | Integrate visual browser, add `handleVisualSelect()`, tab switching |
| `index.html` | Sidebar tab structure, visual browser container |
| `styles/main.css` | Tab styling, visual list, rename highlights, summary tree guides |

### Existing Code to Reuse

- `analyzeImpact()` from `src/graph/impactAnalysis.js` — already does BFS upstream/downstream traversal
- `traceMeasureLineage()` from `src/graph/lineageTracer.js` — reuse per-measure tracing inside visual tracing
- `enrichment.js` field parameter detection — already creates `FIELD_PARAM_TO_FIELD` edges in graph
- `measurePicker.js` patterns — use same sidebar structure, search, grouping, selection for visual browser
- `NODE_COLORS` from `src/utils/constants.js` — use for layer color-coding in summary trees

---

## Improvement Proposals

### P1 — Ship First

- **#1: BigQuery Parameter Resolution** — `graphBuilder.js` already has `resolveParameters()` (lines 236-248). The gap is edge cases where concatenated BQ strings use `& _BillingProject &` patterns in `Value.NativeQuery` SQL strings. Effort: Medium (2-3 hours).
- **#8: Hidden Column/Measure Indicators** — `isHidden` is already encountered during parsing but skipped. Surfacing it as a badge is trivial effort with high governance value. Effort: Low (1-2 hours).
- **#14: Column Data Type Badges** — Data types are already parsed and stored in graph metadata. Only the UI display is missing. Effort: Low (1-2 hours).
- **#16: Bulk Lineage Export** — Loop `traceMeasureLineage()` over all measure nodes and output as JSON/CSV. Effort: Medium (3-4 hours).

### P2 — Next Wave

- **#2: Full GCP Project.Dataset.Table Display** — Display-layer fix to compose `project.dataset.table` in source node labels. Depends on #1. Effort: Low (1 hour after #1).
- **#4: M-Based Field Parameter Detection** — 8 of 21 `prm*` tables missed because they use M sources instead of NAMEOF(). Add `ParameterMetadata` annotation check and naming convention heuristic. Effort: Low-Medium (2 hours).
- **#7: Aggregation Pattern Awareness** — Detect `IF([_IsOnDetailLevel], ...)` dual-path patterns and label branches. Effort: High (6 hours).

### P3 — Backlog

| # | Item | Notes |
|---|------|-------|
| 3 | reportExtensions.json | Rare; not lineage-critical |
| 5 | BigQuery schema catalog | Overlaps with existing Model Health Dashboard |
| 10 | Incremental refresh indicator | Low effort but niche audience |
| 11 | Bookmark-aware lineage | High effort, complex PBIP structure |
| 12 | Cross-report lineage | High effort, workspace-level parsing |
| 13 | Measure description display | Already partially implemented (tooltips exist) |
| 15 | Relationship visualization | Nice-to-have ERD view |
