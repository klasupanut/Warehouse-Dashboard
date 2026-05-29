# Property Unit Map Dashboard - Chat Handoff

Use this project as a standalone prototype, separate from the main warehouse operation dashboard.

Project folder:

```text
C:\Users\User\Documents\Codex\2026-05-06\property-unit-map-dashboard
```

Current files:

- `index.html` - static web app entry point
- `styles.css` - dashboard styling and responsive layout
- `app.js` - unit map logic, filters, CSV import, metrics, detail panel
- `chod5-layout-plan.pdf` - source PDF for Chodthanawat 5
- `chod5-plan.svg` - generated Chodthanawat 5 background
- `chod5-units.js` - clickable Chodthanawat 5 unit overlay
- `sample-units.csv` - sample CSV template
- `README.md` - project notes and CSV schema

Current concept:

- Interactive CHOD Factory & Warehouse Bangna KM.16 layout dashboard.
- `CHOD2 LAYOUT PLAN.dwg` has been exported through AutoCAD Core Console into `cad-entities.tsv`.
- The current master plan background is generated from `CHOD2 LAYOUT PLAN.pdf` as transparent SVG outline in `pdf-plan.svg`.
- Chodthanawat 5 has been added from `chod5-layout-plan.pdf`, with background `chod5-plan.svg` and 18 clickable units in `chod5-units.js` (`AA-1` to `AA-12`, `AB-1` to `AB-6`).
- `pdf-plan-aligned.svg` and `cad-plan.svg` remain available as alternate generated backgrounds.
- Clickable unit overlays are generated from CAD text coordinates in `cad-units.js`, including CAD X/Y/Z metadata.
- Unit colors represent status.
- Clicking a unit opens a detail panel.
- Filters include Phase, Status, Unit Type, and Search.
- CSV import supports the sample schema.
- Map Health checks whether CSV data rows and SVG layout shapes are fully matched.
- Fit Visible zooms the map to currently filtered layout units.
- Embedded and CSV sample data now cover Chodthanawat 1, 2, 3, and 5 mapped unit labels.

Current statuses:

- Available
- Reserved
- Sold
- Under Construction
- Ready to Transfer
- Defect / Risk
- Overdue Payment

Important mapping rule:

`unitId` in CSV must match the SVG layout unit id, such as `A1`, `H1-A`, `J13`, `AA-1`, or `AB-6`.

Suggested next steps:

1. Test the current prototype by opening `index.html`.
2. Fine tune generated unit box sizes if exact click boundaries are required; centers and rotations are CAD-derived.
3. Confirm missing/zero area values against the official sales sheet before production use.
4. Use Map Health to resolve data-only or shape-only unit IDs.
5. Connect to Google Sheet after the SVG mapping approach is confirmed.
6. If successful, merge into the main dashboard later as a new tab.

Prompt for a new Codex chat:

```text
Open and continue this standalone project:
C:\Users\User\Documents\Codex\2026-05-06\property-unit-map-dashboard

This is a prototype for an interactive property unit map dashboard. Please inspect the files and continue from CHAT_HANDOFF.md. Do not merge it into the main warehouse dashboard yet.
```
