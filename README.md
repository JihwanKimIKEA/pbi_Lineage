# PBIP Lineage Explorer

**The only free tool that traces Power BI lineage from Visual → Measure → Source Column — including Power Query renames, field parameters, and calculation groups.** Open your PBIP folder and get instant lineage tracing + commit-by-commit change intelligence.

[![Try Live Demo](https://img.shields.io/badge/Try%20Live%20Demo-▶%20Open%20in%20Browser-28a745?style=for-the-badge&logo=powerbi)](https://jihwankimikea.github.io/pbi_Lineage/)

![GitHub stars](https://img.shields.io/github/stars/JihwanKimIKEA/pbi_Lineage?style=flat) Free forever · 100% client-side · Your files never leave your browser · [MIT License](LICENSE)

> **No PBIP file?** [Try it now with built-in sample data](https://jihwankimikea.github.io/pbi_Lineage/) — no setup required.

---

## The Problem

- You rename a column and 3 reports break. **You have no idea which ones.**
- You need to trace a KPI back to its source columns. You click through **Power BI Desktop for an hour.**
- A colleague commits changes to the `.Report` folder — **you have no idea what visuals, filters, or measures changed.**
- Someone modifies a shared measure — **you don't know which visuals are impacted downstream.**
- A data engineer asks: "What are the real source tables and columns before Power Query renames?" You open **47 TMDL files** and start copy-pasting.

**Each of these takes hours. This tool does it in seconds.**

| | Manual | PBIP Lineage Explorer |
|---|---|---|
| Visual → measure → source column chain | Copy-paste across dozens of files | **One-click interactive graph** |
| Impact analysis ("what breaks?") | Not feasible at scale | **One click** |
| What changed in the last 5 commits? | Diff raw JSON by hand | **Automatic change report with 30+ change types** |
| Downstream impact of a measure edit | Hope and pray | **Traced through refs, field params & calc groups** |
| Source column mapping before PQ rename | Spreadsheet archaeology | **Automatic with full rename chain** |
| Calculation group items & expressions | Open each TMDL file manually | **All items shown with DAX** |

---

## Who Is This For?

**Power BI Developers** — Trace DAX dependencies across measures, find orphan measures, understand downstream impact before making changes, see field parameter and calculation group configurations at a glance.

**Data Engineers** — Find the real source tables and columns *before* Power Query renames. Get an aggregated source mapping across all measures on a visual. Switch to Source View to see sources first, DAX second.

**Team Leads & Governance** — Track changes across commits (measures, columns, relationships, source expressions). Export lineage as CSV/Markdown for documentation. Run impact analysis before approving PRs.

---

## What You Get

### Lineage Tracking

- **Visual-to-source lineage in one click** — trace any measure or visual through its full dependency chain down to the original source column
- **DAX dependency tree** — interactive D3 graph showing every referenced measure and column with syntax-highlighted DAX
- **Calculation group lineage** — see all calculation items (YTD, QTD, MTD, etc.) with their DAX expressions
- **Field parameter resolution** — see ALL measures a field parameter contains, not just the active one
- **Source column mapping** — flat table showing PBI Column → Source Column with full Power Query rename chain tracking
- **Aggregated source columns** — one table showing every source column across all measures on a visual
- **DAX View / Source View toggle** — data engineers see sources first, PBI developers see DAX first
- **Impact analysis** — select any node to instantly see what breaks if you change it
- **Page layout minimap** — see every visual on a report page positioned as in Power BI, click to trace lineage
- **Orphan detection** — find measures that no visual references
- **Model Health Dashboard** — tables, columns, measures, relationships, data sources at a glance
- **Export** — SVG, PNG, CSV, Markdown, or copy lineage to clipboard

### Change Intelligence

- **Commit-by-commit change detection** — see exactly what changed, when, and who is impacted
- **30+ change types across 8 scopes** — pages, visuals, filters, measures, bookmarks, columns, relationships, and source expressions
- **Column schema changes** — detect column add/remove/type changes between commits
- **Relationship changes** — detect relationship add/remove/property changes
- **Source expression changes** — detect M query and data source modifications
- **Calculation item changes** — detect calc group item add/remove/modify with downstream impact
- **Downstream impact tracing** — when a measure changes, see every visual affected through direct refs, field parameters, and calculation groups
- **Human-readable descriptions** — no raw JSON diffs, just plain-language summaries
- **Works in browser and VS Code** — same detection engine, both platforms

> Your files never leave your browser. All parsing happens client-side — nothing is uploaded anywhere.

---

## Quick Start

1. Open **[jihwankimikea.github.io/pbi_Lineage](https://jihwankimikea.github.io/pbi_Lineage/)**
2. Click **Open Project Folder** and select your PBIP project root (the folder with `.SemanticModel` and `.Report` subfolders)
3. Click any measure or visual in the sidebar to trace its lineage
4. Use **Export** buttons to save the lineage graph as SVG/PNG or source mappings as CSV

> Requires **Chrome 86+** or **Edge 86+** ([File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)). Firefox and Safari are not supported.

---

## VS Code Extension

Also available as a VS Code extension for developers who work directly in PBIP/TMDL files.

- Search **"PBIP Lineage Explorer"** in the VS Code Extensions marketplace
- Auto-activates when your workspace contains `.tmdl` files
- **Sidebar panels**: Measure Explorer, Orphan Measures, Model Stats, Change History
- **CodeLens**: inline "Trace Lineage" links above measure definitions
- **Change History panel**: auto-scans recent commits, shows changes grouped by commit → scope → detail with impact badges

---

## More

- [Detailed reference guide](docs/reference.md) — UI overview, keyboard shortcuts, use cases, folder structure
- [Development guide](DEVELOPMENT.md) — architecture, setup, project structure, and roadmap
- [License](LICENSE) — MIT
