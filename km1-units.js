(function () {
  const pageHeight = 1190.52;
  const p = (x, y) => [x, pageHeight - y];
  const centroid = (points) => {
    const total = points.reduce((acc, point) => ({ x: acc.x + point[0], y: acc.y + point[1] }), { x: 0, y: 0 });
    return { x: total.x / points.length, y: total.y / points.length };
  };
  const unit = (unitId, block, points, area = 0, label = null) => {
    const center = label || centroid(points);
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return {
      unitId,
      unitNo: unitId,
      block,
      points,
      labelX: center.x,
      labelY: center.y,
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      area
    };
  };

  const lowerUnits = [
    unit("UNIT 1", "UNIT", [p(410.52, 787.68), p(516.48, 787.68), p(514.56, 628.2), p(410.52, 628.2)]),
    unit("UNIT 2", "UNIT", [p(304.56, 787.68), p(410.52, 787.68), p(410.52, 628.2), p(304.56, 628.2)]),
    unit("UNIT 3", "UNIT", [p(410.52, 628.2), p(514.56, 628.2), p(507, 628.2), p(507, 476.7), p(410.52, 476.7)], 0, { x: 456.39, y: 641.26 }),
    unit("UNIT 4", "UNIT", [p(304.56, 628.2), p(410.52, 628.2), p(410.52, 476.7), p(304.56, 476.7)]),
    unit("UNIT 5", "UNIT", [p(410.52, 476.7), p(497.52, 476.7), p(497.52, 340.5), p(410.52, 340.5)]),
    unit("UNIT 6.1", "UNIT", [p(304.56, 476.7), p(410.52, 476.7), p(410.52, 408.6), p(304.56, 408.6)]),
    unit("UNIT 6.2", "UNIT", [p(304.56, 408.6), p(410.52, 408.6), p(410.52, 340.5), p(304.56, 340.5)]),
    unit("UNIT 7", "UNIT", [p(410.52, 340.5), p(497.52, 340.5), p(497.52, 204.3), p(410.52, 204.3)]),
    unit("UNIT 8.1", "UNIT", [p(304.56, 340.5), p(410.52, 340.5), p(410.52, 272.46), p(304.56, 272.46)]),
    unit("UNIT 8.2", "UNIT", [p(304.56, 272.46), p(410.52, 272.46), p(410.52, 204.3), p(304.56, 204.3)]),
    unit("UNIT 9", "UNIT", [p(410.52, 204.3), p(497.52, 204.3), p(497.52, 135.48), p(410.52, 95.76)]),
    unit("UNIT 10", "UNIT", [p(304.56, 204.3), p(410.52, 204.3), p(410.52, 95.76), p(497.52, 135.48), p(306.48, 44.76), p(304.56, 44.76)], 0, { x: 357.54, y: 1068.96 })
  ];

  const srUnits = [
    unit("SR-A", "SR", [p(463.8, 1024.44), p(529.68, 1092.6), p(545.16, 1077.72), p(549, 1074.6), p(548.04, 1047.6), p(547.08, 1019.64), p(546.48, 991.32), p(523.08, 967.68)], 0, { x: 522, y: pageHeight - 1015 }),
    unit("SR-B", "SR", [p(424.44, 983.64), p(463.92, 1024.44), p(550.2, 941.76), p(510.72, 900.84)], 0, { x: 487.32, y: pageHeight - 962.64 }),
    unit("SR-C", "SR", [p(384.96, 942.72), p(424.44, 983.64), p(510.72, 900.84), p(471.24, 860.04)], 0, { x: 438, y: pageHeight - 925 }),
    unit("SR-D", "SR", [p(345.24, 903.24), p(384.96, 942.72), p(471.24, 860.04), p(451.68, 837.48), p(413.16, 836.4), p(345.36, 901.8)], 0, { x: 399, y: pageHeight - 885 })
  ];

  window.km1Units = [...srUnits, ...lowerUnits];
})();
