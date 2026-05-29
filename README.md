# Property Unit Map Dashboard

Standalone prototype for an interactive CHOD Factory & Warehouse Bangna KM.16 layout plan dashboard.

## Open

Open `index.html` in a browser.

## Concept

- The layout plan is an inline SVG.
- The KM.16 master plan is rendered from `CHOD2 LAYOUT PLAN.pdf` through a generated transparent SVG (`pdf-plan.svg`).
- Chodthanawat 5 is rendered from `chod5-layout-plan.pdf` through generated SVG background `chod5-plan.svg`.
- Clickable overlay units come from project-specific unit files such as `cad-units.js`, `km1-units.js`, `rama2-units.js`, and `chod5-units.js`.
- Unit data comes from embedded sample data or `sample-units.csv`.
- The dashboard matches data to map positions by `unitId`.
- Map Health shows whether imported CSV rows and SVG shapes are fully matched.
- Fit Visible zooms the SVG viewBox to the currently filtered units.
- Current embedded sample data covers the mapped Chodthanawat 1, 2, 3, and 5 unit labels.

## CSV Columns

```csv
unitId,project,phase,block,unitNo,unitType,area,price,status,progress,customer,contractDate,transferDate,defectStatus,paymentStatus,owner,remark
```

Important:

- `unitId` must match a layout unit in the SVG, such as `A1`, `H1-A`, `J13`, `AA-1`, or `AB-6`.
- `status` should match one of:
  - Available
  - Reserved
  - Sold
  - Under Construction
  - Ready to Transfer
  - Defect / Risk
  - Overdue Payment

## Next Steps

- Fine tune generated unit box sizes if exact click boundaries are required; their centers and rotations are CAD-derived.
- Confirm missing/zero area values against the official sales sheet before using as production data.
- `pdf-plan-aligned.svg` and `cad-plan.svg` remain available as alternate generated backgrounds.
- Use Map Health to catch CSV rows without matching shapes and SVG shapes without data rows.
- Add Google Sheet sync after the layout mapping approach is confirmed.
- Later, merge the successful concept into the main warehouse dashboard as a new tab.
