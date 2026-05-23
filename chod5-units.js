(function () {
  const pageHeight = 1190.52;
  const visualHeightExpandRatio = 0.15;
  const expandVisualHeight = (x1, x2, direction) => {
    const expandBy = (x2 - x1) * visualHeightExpandRatio;
    if (direction === "up") return [x1 - expandBy, x2];
    if (direction === "down") return [x1, x2 + expandBy];
    return [x1, x2];
  };
  const unit = (unitId, block, x1, y1, x2, y2, area = 0, expandDirection = "none") => {
    const [expandedX1, expandedX2] = expandVisualHeight(x1, x2, expandDirection);
    return {
      unitId,
      unitNo: unitId,
      block,
      points: [
        [expandedX1, y1],
        [expandedX2, y1],
        [expandedX2, y2],
        [expandedX1, y2]
      ],
      labelX: (expandedX1 + expandedX2) / 2,
      labelY: (y1 + y2) / 2,
      x: expandedX1,
      y: y1,
      width: expandedX2 - expandedX1,
      height: y2 - y1,
      area
    };
  };

  const leftX1 = 325.84;
  const midX = 398.31;
  const rightX2 = 470.74;
  const aaRows = [
    ["1", 868.02, 934.14],
    ["2", 802.14, 868.02],
    ["3", 736.32, 802.14],
    ["4", 670.49, 736.32],
    ["5", 604.62, 670.49],
    ["6", 538.5, 604.62]
  ];
  const abRows = [
    ["1", 359.52, 491.73],
    ["2", 227.85, 359.52],
    ["3", 95.67, 227.85]
  ];

  const aaRightUnits = aaRows.map(([no, y1, y2]) => unit(`AA-${Number(no) + 6}`, "AA", midX, y1, rightX2, y2, 0, "down"));
  const aaLeftUnits = aaRows.map(([no, y1, y2]) => unit(`AA-${no}`, "AA", leftX1, y1, midX, y2, 0, "up"));
  const abRightUnits = abRows.map(([no, y1, y2]) => unit(`AB-${Number(no) + 3}`, "AB", midX, y1, rightX2, y2, 0, "down"));
  const abLeftUnits = abRows.map(([no, y1, y2]) => unit(`AB-${no}`, "AB", leftX1, y1, midX, y2, 0, "up"));

  window.chod5Units = [...aaRightUnits, ...aaLeftUnits, ...abRightUnits, ...abLeftUnits];
})();
