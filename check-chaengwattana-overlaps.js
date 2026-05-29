global.window = {};
require("../chaengwattana-units.js");

const units = window.chaengwattanaUnits;

function axes(points) {
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const dx = next[0] - point[0];
    const dy = next[1] - point[1];
    const length = Math.hypot(dx, dy) || 1;
    return { x: -dy / length, y: dx / length };
  });
}

function project(points, axis) {
  const values = points.map(([x, y]) => x * axis.x + y * axis.y);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function overlaps(a, b) {
  for (const axis of [...axes(a.points), ...axes(b.points)]) {
    const pa = project(a.points, axis);
    const pb = project(b.points, axis);
    if (pa.max <= pb.min + 0.02 || pb.max <= pa.min + 0.02) return false;
  }
  return true;
}

const problems = [];
for (let i = 0; i < units.length; i += 1) {
  for (let j = i + 1; j < units.length; j += 1) {
    if (units[i].block !== units[j].block) continue;
    if (overlaps(units[i], units[j])) problems.push(`${units[i].unitId}/${units[j].unitId}`);
  }
}

console.log(`${units.length} units`);
console.log(problems.length ? problems.join(", ") : "no same-block overlaps");
