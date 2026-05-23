(() => {
  const X0 = 8.64;
  const Y0 = 221.64;
  const units = [];

  const addUnit = (unitId, block, x, y, width, height, rotate = 0) => {
    units.push({
      unitId,
      unitNo: unitId,
      block,
      x: x - X0,
      y: y - Y0,
      width,
      height,
      rotate,
      area: 0
    });
  };

  const addGridFromLines = (block, rows, xLines, yLines, rotate = 0) => {
    rows.forEach((row, rowIndex) => {
      row.forEach((unitId, colIndex) => {
        if (!unitId) return;
        addUnit(
          unitId,
          block,
          X0 + xLines[colIndex],
          Y0 + yLines[rowIndex],
          xLines[colIndex + 1] - xLines[colIndex],
          yLines[rowIndex + 1] - yLines[rowIndex],
          rotate
        );
      });
    });
  };

  const rotateBlock = (block, degrees) => {
    const blockUnits = units.filter((unit) => unit.block === block);
    const minX = Math.min(...blockUnits.map((unit) => unit.x));
    const minY = Math.min(...blockUnits.map((unit) => unit.y));
    const maxX = Math.max(...blockUnits.map((unit) => unit.x + unit.width));
    const maxY = Math.max(...blockUnits.map((unit) => unit.y + unit.height));
    const origin = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    const radians = degrees * Math.PI / 180;
    blockUnits.forEach((unit) => {
      const center = { x: unit.x + unit.width / 2, y: unit.y + unit.height / 2 };
      const dx = center.x - origin.x;
      const dy = center.y - origin.y;
      const nextCenter = {
        x: origin.x + dx * Math.cos(radians) - dy * Math.sin(radians),
        y: origin.y + dx * Math.sin(radians) + dy * Math.cos(radians)
      };
      unit.x = nextCenter.x - unit.width / 2;
      unit.y = nextCenter.y - unit.height / 2;
      unit.rotate += degrees;
    });
  };

  const shrinkFHeight = () => {
    units
      .filter((unit) => unit.block === "F")
      .forEach((unit) => {
        const shrink = unit.width * 0.15;
        if (/^F([1-8])$/.test(unit.unitId)) unit.x += shrink;
        unit.width -= shrink;
      });
  };

  const shrinkGLeftLength = () => {
    units
      .filter((unit) => /^G[4-6]$/.test(unit.unitId))
      .forEach((unit) => {
        unit.height *= 0.8;
      });
  };

  addGridFromLines("B", [
    ["B6", "B7", "B8", "B9", "B10"],
    ["B1", "B2", "B3", "B4", "B5"]
  ], [80.0, 123.7, 163.0, 199.7, 241.7, 279.7], [54.4, 105.5, 158.5]);

  addGridFromLines("C", [
    ["C6", "C7", "C8", "C9", "C10"],
    ["C1", "C2", "C3", "C4", "C5"]
  ], [312.2, 361.3, 400.9, 440.5, 475.9, 521.4], [40.9, 95.9, 149.8]);

  addGridFromLines("G", [
    ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"]
  ], [318.0, 347.5, 377.9, 407.2, 436.4, 466.8, 497.6, 526.5, 557.0], [224.6, 285.8]);

  addGridFromLines("D", [
    ["D5", "D1"],
    ["D6", "D2"],
    ["D7", "D3"]
  ], [153.1, 211.5, 265.7], [243.2, 283.0, 323.0, 362.9]);
  addUnit("D4", "D", X0 + 171.3, Y0 + 364.2, 93.3, 39.9);

  addUnit("E1", "E", X0 + 159.7, Y0 + 432.9, 82.1, 42.8);
  addGridFromLines("E", [
    ["E5", "E2"],
    ["E6", "E3"]
  ], [136.7, 186.5, 240.5], [476.8, 515.0, 557.9]);
  addUnit("E4", "E", X0 + 184.0, Y0 + 557.9, 52.8, 42.9);

  addGridFromLines("F", [
    ["F1", "F9"],
    ["F2", "F10"],
    ["F3", "F11"],
    ["F4", "F12"],
    ["F5", "F13"],
    ["F6", "F14"],
    ["F7", "F15"],
    ["F8", "F16"]
  ], [278.5, 342.7, 407.0], [341.2, 381.6, 421.5, 461.3, 501.2, 541.0, 580.9, 620.6, 660.8]);

  shrinkFHeight();
  rotateBlock("B", -2.2);
  rotateBlock("C", -2.2);
  rotateBlock("G", -2.2);
  shrinkGLeftLength();
  rotateBlock("D", 6.1);
  rotateBlock("E", 6.1);
  rotateBlock("F", 6.35);

  window.rama2Units = units;
})();
