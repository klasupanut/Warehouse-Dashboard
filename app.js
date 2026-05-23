const statusConfig = {
  Available: { color: "#2fffc7" },
  Occupied: { color: "#ff6f86" },
  "Under Construction": { color: "#ffd166" }
};

const blockColors = {
  A: "#ff6f86",
  B: "#35d8ff",
  C: "#ffd166",
  D: "#2fffc7",
  E: "#a78bfa",
  F: "#ff9f1c",
  G: "#f472b6",
  H: "#38bdf8",
  I: "#84cc16",
  J: "#0f8f5f",
  AA: "#35d8ff",
  AB: "#ffd166",
  SR: "#77d8ff",
  UNIT: "#c770ff"
};

const MAP_WIDTH = 2048;
const MAP_HEIGHT = 1376;
const PROJECT_CHOD1 = "Factory&Warehouse Chodthanawat 1";
const PROJECT_CHOD2 = "Factory&Warehouse Chodthanawat 2";
const PROJECT_CHOD3 = "Factory&Warehouse Chodthanawat 3";
const PROJECT_CHOD5 = "Factory&Warehouse Chodthanawat 5";
const PROJECT_NAME = PROJECT_CHOD2;
const DEFAULT_GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1I5Z_MjvqTZlkb7NJJMieP0_SKcNmervyP7w_KCHRpac/edit";
const SHEET_URL_STORAGE_KEY = "warehouseDashboard.googleSheetUrl";
const PROJECT_SHEETS = [
  PROJECT_CHOD1,
  PROJECT_CHOD2,
  PROJECT_CHOD3,
  PROJECT_CHOD5,
  "CHODBIZ CHAENGWATTANA",
  "CHOD BIZ BANGNA KM.8",
  "CHODBIZ PUTTHAMONTHON SAI 4"
];
let projectSheets = [...PROJECT_SHEETS];
const UNIT_OFFSET_X = -38;
const UNIT_OFFSET_Y = 10;
const UNIT_BOX_SCALE = 0.74;
const DEFAULT_VIEW_PADDING = 45;
const VISIBLE_VIEW_PADDING = 42;
const cadUnits = window.cadUnits || [];
const rama2Units = window.rama2Units || [];
const km1Units = window.km1Units || [];
const chod5Units = window.chod5Units || [];

const sampleUnits = cadUnits.map(({ unitId, block, area }) => [
  unitId,
  PROJECT_NAME,
  block,
  unitId,
  "Factory/Warehouse",
  area,
  0,
  "",
  "Available",
  "",
  "",
  "",
  "",
  "Sales",
  "Extracted from Master Plan KM.16 image; overlay position is approximate"
]).map(([unitId, project, block, unitNo, unitType, warehouseArea, officeArea, loadCapacity, status, customer, transferDate, contractTermYears, contractEndDate, owner, remark]) => ({
  unitId,
  project,
  phase: block,
  block,
  unitNo,
  unitType,
  warehouseArea: Number(warehouseArea),
  officeArea: Number(officeArea),
  loadCapacity: parseOptionalNumber(loadCapacity),
  area: Number(warehouseArea),
  status,
  customer,
  transferDate,
  contractTermYears: Number(contractTermYears || 0),
  contractEndDate,
  owner,
  remark
}));

const rama2SampleUnits = rama2Units.map(({ unitId, unitNo, block, area }) => ({
  unitId,
  project: PROJECT_CHOD3,
  phase: block,
  block,
  unitNo: unitNo || unitId,
  unitType: "Factory/Warehouse",
  warehouseArea: Number(area || 0),
  officeArea: 0,
  loadCapacity: null,
  area: Number(area || 0),
  status: "Available",
  customer: "",
  transferDate: "",
  contractTermYears: 0,
  contractEndDate: "",
  owner: "Sales",
  remark: "Extracted from Rama II layout plan PDF; overlay position is approximate"
}));

const km1SampleUnits = km1Units.map(({ unitId, unitNo, block, area }) => ({
  unitId,
  project: PROJECT_CHOD1,
  phase: block,
  block,
  unitNo: unitNo || unitId,
  unitType: "Factory/Warehouse",
  warehouseArea: Number(area || 0),
  officeArea: 0,
  loadCapacity: null,
  area: Number(area || 0),
  status: "Available",
  customer: "",
  transferDate: "",
  contractTermYears: 0,
  contractEndDate: "",
  owner: "Sales",
  remark: "Extracted from KM1 layout plan PDF; overlay position is approximate"
}));

const chod5SampleUnits = chod5Units.map(({ unitId, unitNo, block, area }) => ({
  unitId,
  project: PROJECT_CHOD5,
  phase: block,
  block,
  unitNo: unitNo || unitId,
  unitType: "Factory/Warehouse",
  warehouseArea: Number(area || 0),
  officeArea: 0,
  loadCapacity: null,
  area: Number(area || 0),
  status: "Available",
  customer: "",
  transferDate: "",
  contractTermYears: 0,
  contractEndDate: "",
  owner: "Sales",
  remark: "Extracted from Chodthanawat 5 layout plan PDF; overlay position is approximate"
}));

const cadUnitById = new Map(cadUnits.map((unit) => [unit.unitId, unit]));
let layoutUnits = cadUnits.map(({ unitId, block, x, y, width, height, rotate, cadX, cadY, cadZ }) => {
  const adjust = getUnitLayoutAdjustments(unitId);
  const scaledWidth = width * adjust.scale;
  const scaledHeight = height * adjust.scale * (adjust.heightScale || 1);
  return {
    unitId,
    block,
    x: x + UNIT_OFFSET_X + adjust.x + (width - scaledWidth) / 2,
    y: y + UNIT_OFFSET_Y + adjust.y + (height - scaledHeight) / 2,
    width: scaledWidth,
    height: scaledHeight,
    rotate,
    cadX,
    cadY,
    cadZ
  };
});
layoutUnits = resolveUnitCollisions(layoutUnits, new Set(["A", "B", "D", "E", "G", "J"]));
const projectPlanConfigs = {
  [PROJECT_CHOD1]: {
    units: km1Units,
    mapWidth: 1190.52,
    mapHeight: 841.92,
    defaultPadding: 34,
    visiblePadding: 18,
    compactBlocks: new Set(["SR"]),
    rotation: "counterClockwise90",
    layerTransform: "matrix(0 -1 1 0 0 841.92)",
    image: {
      href: "./km1-plan.svg?v=20260522-1",
      x: 0,
      y: 0,
      width: 841.92,
      height: 1190.52,
      preserveAspectRatio: "xMinYMin meet",
      transform: "matrix(0 -1 1 0 0 841.92)"
    }
  },
  [PROJECT_CHOD2]: {
    units: layoutUnits,
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT,
    defaultPadding: DEFAULT_VIEW_PADDING,
    visiblePadding: VISIBLE_VIEW_PADDING,
    compactBlocks: new Set(["G", "J"]),
    image: {
      href: "./pdf-plan.svg?v=20260513-2",
      x: -20,
      y: -810,
      width: 2146.56,
      height: 3194.88,
      preserveAspectRatio: "xMidYMid meet",
      transform: "translate(0 1376) scale(1 -1) rotate(-270 1024 688)"
    }
  },
  [PROJECT_CHOD3]: {
    units: rama2Units,
    mapWidth: 770.28,
    mapHeight: 824.88,
    defaultPadding: 28,
    visiblePadding: 18,
    compactBlocks: new Set(["F", "G"]),
    rotation: "clockwise90MirrorX",
    layerTransform: "matrix(0 -1 -1 0 770.28 824.88)",
    image: {
      href: "./rama2-plan.svg?v=20260520-2",
      x: 0,
      y: 0,
      width: 824.88,
      height: 770.28,
      preserveAspectRatio: "xMinYMin meet",
      transform: "matrix(0 -1 -1 0 770.28 824.88)"
    }
  },
  [PROJECT_CHOD5]: {
    units: chod5Units,
    mapWidth: 1190.52002,
    mapHeight: 841.92004,
    defaultPadding: 36,
    visiblePadding: 22,
    compactBlocks: new Set(["AA", "AB"]),
    rotation: "clockwise90",
    layerTransform: "matrix(0 1 -1 0 1190.52002 0)",
    image: {
      href: "./chod5-plan.svg?v=20260523-6",
      x: 0,
      y: 0,
      width: 841.92004,
      height: 1190.52002,
      preserveAspectRatio: "xMinYMin meet",
      transform: "matrix(0 1 -1 0 1190.52002 0)"
    }
  }
};

let unitRows = [...km1SampleUnits, ...sampleUnits, ...rama2SampleUnits, ...chod5SampleUnits];
let filteredRows = [...unitRows];
let selectedUnitId = null;
let mapZoomMode = "all";
let mapDragState = null;
let dashboardMode = "marketing";

const els = {
  sheetUrlInput: document.querySelector("#sheetUrlInput"),
  connectSheetBtn: document.querySelector("#connectSheetBtn"),
  dataStatus: document.querySelector("#dataStatus"),
  controlTitle: document.querySelector("#controlTitle"),
  projectTitle: document.querySelector("#projectTitle"),
  projectFilter: document.querySelector("#projectFilter"),
  phaseFilter: document.querySelector("#phaseFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  searchBox: document.querySelector("#searchBox"),
  clearFiltersBtn: document.querySelector("#clearFiltersBtn"),
  modeButtons: document.querySelectorAll(".mode-switch button"),
  legend: document.querySelector("#legend"),
  unitLayer: document.querySelector("#unitLayer"),
  unitLabelLayer: document.querySelector("#unitLabelLayer"),
  unitTable: document.querySelector("#unitTable"),
  refreshRegisterBtn: document.querySelector("#refreshRegisterBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  visibleCount: document.querySelector("#visibleCount"),
  fitVisibleBtn: document.querySelector("#fitVisibleBtn"),
  mappingIssues: document.querySelector("#mappingIssues"),
  mapViewport: document.querySelector(".map-viewport"),
  unitMap: document.querySelector("#unitMap"),
  masterPlanImage: document.querySelector("#masterPlanImage"),
  allProjectDashboard: document.querySelector("#allProjectDashboard"),
  projectPlanPending: document.querySelector("#projectPlanPending"),
  detailCard: document.querySelector("#detailCard"),
  occupancyRate: document.querySelector("#occupancyRate"),
  totalUnits: document.querySelector("#totalUnits"),
  availableUnits: document.querySelector("#availableUnits"),
  soldUnits: document.querySelector("#soldUnits"),
  readyUnits: document.querySelector("#readyUnits"),
  lastUpdated: document.querySelector("#lastUpdated"),
  detailTitle: document.querySelector("#detailTitle"),
  detailStatus: document.querySelector("#detailStatus"),
  detailPhase: document.querySelector("#detailPhase"),
  detailArea: document.querySelector("#detailArea"),
  detailOfficeArea: document.querySelector("#detailOfficeArea"),
  detailLoadCapacity: document.querySelector("#detailLoadCapacity"),
  detailCustomer: document.querySelector("#detailCustomer"),
  detailTransfer: document.querySelector("#detailTransfer"),
  detailContractTerm: document.querySelector("#detailContractTerm"),
  detailContractEnd: document.querySelector("#detailContractEnd")
};

function getUnitLayoutAdjustments(unitId) {
  const match = unitId.match(/^([A-Z]+)(\d+)/);
  const block = match?.[1] || unitId.charAt(0);
  const number = Number(match?.[2] || 0);
  const adjust = { x: 0, y: 0, scale: UNIT_BOX_SCALE };

  if (["A", "B", "D", "E"].includes(block)) adjust.scale = 0.82;
  if (block === "G" || block === "J") adjust.scale = 0.56;
  if (block === "A" && number >= 1 && number <= 5) Object.assign(adjust, { x: -18, y: -5 });
  if (block === "C" && number >= 1 && number <= 4) Object.assign(adjust, { x: -13, y: -4 });
  if (block === "D" && number >= 1 && number <= 3) Object.assign(adjust, { x: -18, y: -6 });
  if (block === "F" && number >= 1 && number <= 4) Object.assign(adjust, { x: -13, y: -4 });
  if (block === "B" && number >= 1 && number <= 5) adjust.x -= 10;
  if (block === "I") adjust.y -= 5;
  if (block === "H" && number >= 6 && number <= 10) adjust.heightScale = 1.08;
  if (["B", "C", "E", "F", "I", "G", "J"].includes(block) || (block === "H" && number >= 5 && number <= 10)) {
    adjust.x -= 5;
  }

  return adjust;
}

function resolveUnitCollisions(units, targetBlocks) {
  const resolved = units.map((unit) => ({ ...unit }));
  for (let iteration = 0; iteration < 20; iteration += 1) {
    let moved = 0;
    for (let index = 0; index < resolved.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < resolved.length; nextIndex += 1) {
        const current = resolved[index];
        const next = resolved[nextIndex];
        if (current.block !== next.block || !targetBlocks.has(current.block)) continue;
        const overlap = getMinimumTranslation(current, next);
        if (!overlap) continue;
        const push = (overlap.depth + 0.8) / 2;
        current.x -= overlap.axis.x * push;
        current.y -= overlap.axis.y * push;
        next.x += overlap.axis.x * push;
        next.y += overlap.axis.y * push;
        moved += 1;
      }
    }
    if (!moved) break;
  }
  return resolved;
}

function getMinimumTranslation(first, second) {
  const firstPolygon = getRotatedRect(first);
  const secondPolygon = getRotatedRect(second);
  let best = null;
  for (const axis of [...getAxes(firstPolygon), ...getAxes(secondPolygon)]) {
    const firstRange = projectPolygon(firstPolygon, axis);
    const secondRange = projectPolygon(secondPolygon, axis);
    const depth = Math.min(firstRange.max, secondRange.max) - Math.max(firstRange.min, secondRange.min);
    if (depth <= 0) return null;
    if (!best || depth < best.depth) best = { axis, depth };
  }
  const firstCenter = getUnitCenter(first);
  const secondCenter = getUnitCenter(second);
  const direction = (secondCenter.x - firstCenter.x) * best.axis.x + (secondCenter.y - firstCenter.y) * best.axis.y;
  if (direction < 0) best.axis = { x: -best.axis.x, y: -best.axis.y };
  return best;
}

function getRotatedRect(unit) {
  const center = getUnitCenter(unit);
  const radians = (unit.rotate || 0) * Math.PI / 180;
  return [
    [unit.x, unit.y],
    [unit.x + unit.width, unit.y],
    [unit.x + unit.width, unit.y + unit.height],
    [unit.x, unit.y + unit.height]
  ].map(([x, y]) => {
    const dx = x - center.x;
    const dy = y - center.y;
    return {
      x: center.x + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: center.y + dx * Math.sin(radians) + dy * Math.cos(radians)
    };
  });
}

function getUnitCenter(unit) {
  return { x: unit.x + unit.width / 2, y: unit.y + unit.height / 2 };
}

function getAxes(polygon) {
  return polygon.map((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const edgeX = next.x - point.x;
    const edgeY = next.y - point.y;
    const length = Math.hypot(edgeX, edgeY) || 1;
    return { x: -edgeY / length, y: edgeX / length };
  });
}

function projectPolygon(polygon, axis) {
  const values = polygon.map((point) => point.x * axis.x + point.y * axis.y);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function render() {
  els.projectTitle.textContent = PROJECT_NAME;
  renderOptions();
  applyFilters();
  renderLegend();
  updateClock();
}

function renderOptions() {
  setOptions(els.projectFilter, uniquePreserveOrder([...projectSheets, ...unitRows.map((row) => row.project)]));
  setOptions(els.phaseFilter, unique(unitRows.map((row) => row.block)));
  setOptions(els.statusFilter, Object.keys(statusConfig));
}

function setOptions(select, options) {
  const current = select.value;
  select.innerHTML = `<option value="all">All</option>${options.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}`;
  select.value = options.includes(current) ? current : "all";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

function uniquePreserveOrder(values) {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function setDataStatus(message, isError = false) {
  els.dataStatus.textContent = message;
  els.dataStatus.classList.toggle("is-error", isError);
}

function mergePlannedFallbackRows(rows) {
  const existingKeys = new Set(rows.map(getProjectUnitKey));
  const fallbackRows = [...km1SampleUnits, ...sampleUnits, ...rama2SampleUnits].filter((row) => !existingKeys.has(getProjectUnitKey(row)));
  return [...rows, ...fallbackRows];
}

function getUnitLookupKey(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function getRowUnitKeys(row) {
  return uniquePreserveOrder([row.unitId, row.unitNo].map(getUnitLookupKey).filter(Boolean));
}

function getProjectUnitKey(row) {
  return `${getProjectLookupKey(row.project)}|||${getUnitLookupKey(row.unitId || row.unitNo)}`;
}

function rowMatchesUnit(row, unitId) {
  const key = getUnitLookupKey(unitId);
  return Boolean(key && getRowUnitKeys(row).includes(key));
}

function getProjectLookupKey(projectName) {
  return getUnitLookupKey(getProjectPlanKey(projectName));
}

function rowMatchesProject(row, projectName) {
  return projectName === "all" || row.project === projectName || getProjectLookupKey(row.project) === getProjectLookupKey(projectName);
}

function createProjectRowMap(projectName) {
  const map = new Map();
  unitRows
    .filter((row) => rowMatchesProject(row, projectName))
    .forEach((row) => {
      getRowUnitKeys(row).forEach((key) => {
        if (!map.has(key)) map.set(key, row);
      });
    });
  return map;
}

function applyFilters() {
  const project = els.projectFilter.value;
  const block = els.phaseFilter.value;
  const status = els.statusFilter.value;
  const search = normalize(els.searchBox.value);
  els.projectTitle.textContent = project === "all" ? "All Projects" : project;

  filteredRows = unitRows.filter((row) => {
    const matchesProject = rowMatchesProject(row, project);
    const matchesBlock = block === "all" || row.block === block;
    const matchesStatus = status === "all" || row.status === status;
    const haystack = normalize(`${row.unitId} ${row.unitNo} ${row.phase} ${row.block} ${row.unitType} ${row.status} ${row.customer} ${row.owner}`);
    return matchesProject && matchesBlock && matchesStatus && haystack.includes(search);
  });

  if (selectedUnitId && !filteredRows.some((row) => rowMatchesUnit(row, selectedUnitId))) {
    selectedUnitId = null;
  }

  renderMap();
  renderMetrics();
  renderTable();
  renderDetail();
}

function renderLegend() {
  els.legend.innerHTML = Object.entries(statusConfig)
    .map(([status, config]) => {
      const count = unitRows.filter((row) => row.status === status).length;
      return `<div class="legend-item"><i style="background:${config.color}"></i><span>${status}</span><strong>${count}</strong></div>`;
    })
    .join("");
}

function renderMap() {
  const selectedProject = els.projectFilter.value;
  if (selectedProject === "all") {
    renderAllProjectDashboard();
    setMapDisplayMode("aggregate");
    els.visibleCount.textContent = `${filteredRows.length} total visible units`;
    return;
  }

  const planConfig = getProjectPlanConfig(selectedProject);
  if (!planConfig) {
    renderProjectPlanPending(selectedProject);
    setMapDisplayMode("pending");
    els.visibleCount.textContent = "Plan file pending";
    return;
  }

  applyPlanImage(planConfig);
  setMapDisplayMode("plan");
  const visibleIds = new Set(filteredRows.flatMap(getRowUnitKeys));
  const rowMap = createProjectRowMap(selectedProject);

  const renderedUnits = planConfig.units.map((unit) => {
      const row = rowMap.get(getUnitLookupKey(unit.unitId)) || rowMap.get(getUnitLookupKey(unit.unitNo));
      const fallbackBlock = unit.block || unit.unitId.charAt(0);
      const unitNo = row?.unitNo || unit.unitNo || unit.unitId;
      const labelNo = unit.unitNo || unit.unitId || row?.unitNo;
      const color = statusConfig[row?.status]?.color || "#64748b";
      const blockColor = blockColors[row?.block || fallbackBlock] || "#d8fbff";
      const hidden = !visibleIds.has(getUnitLookupKey(unit.unitId)) && !visibleIds.has(getUnitLookupKey(unit.unitNo));
      const selected = selectedUnitId === unit.unitId;
      const compact = planConfig.compactBlocks?.has(row?.block || fallbackBlock);
      const labelX = unit.labelX ?? unit.x + unit.width / 2;
      const labelY = unit.labelY ?? unit.y + unit.height / 2 + 4;
      const displayLabel = getDisplayPoint({ x: labelX, y: labelY }, planConfig);
      const shapeMarkup = renderUnitShape(unit, color, blockColor);
      const transform = unit.rotate && !unit.points ? ` transform="rotate(${unit.rotate} ${labelX} ${labelY})"` : "";
      return {
        block: row?.block || fallbackBlock,
        shape: `
        <g class="unit-group ${compact ? "is-compact" : ""} ${hidden ? "is-hidden" : ""} ${selected ? "is-selected" : ""}" data-unit-id="${unit.unitId}" data-block="${escapeHtml(row?.block || fallbackBlock)}" tabindex="0" role="button" aria-label="${escapeHtml(labelNo)}"${transform}>
          ${shapeMarkup}
        </g>`,
        label: `<text class="unit-label ${compact ? "is-compact" : ""} ${hidden ? "is-hidden" : ""}" x="${displayLabel.x}" y="${displayLabel.y}">${escapeHtml(labelNo)}</text>`
      };
    });

  els.unitLayer.innerHTML = groupRenderedUnitsByBlock(renderedUnits)
    .map(([block, units]) => `<g class="block-unit-layer" data-block="${escapeHtml(block)}">${units.map((unit) => unit.shape).join("")}</g>`)
    .join("");
  els.unitLabelLayer.innerHTML = renderedUnits.map((unit) => unit.label).join("");

  els.visibleCount.textContent = `${filteredRows.length} visible units`;
  fitMapToVisibleUnits();
  document.querySelectorAll(".unit-group").forEach((node) => {
    node.addEventListener("click", () => selectUnit(node.dataset.unitId));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") selectUnit(node.dataset.unitId);
    });
  });
}

function renderUnitShape(unit, color, blockColor) {
  if (unit.points?.length) {
    const points = unit.points.map(([x, y]) => `${roundViewBox(x)},${roundViewBox(y)}`).join(" ");
    return `<polygon class="unit-shape" points="${points}" fill="${color}" stroke="${blockColor}"></polygon>`;
  }

  return `<rect class="unit-shape" x="${unit.x}" y="${unit.y}" width="${unit.width}" height="${unit.height}" rx="3" fill="${color}" stroke="${blockColor}"></rect>`;
}

function hasProjectPlan(projectName) {
  return Boolean(getProjectPlanConfig(projectName));
}

function groupRenderedUnitsByBlock(renderedUnits) {
  const groups = new Map();
  renderedUnits.forEach((unit) => {
    if (!groups.has(unit.block)) groups.set(unit.block, []);
    groups.get(unit.block).push(unit);
  });
  return [...groups.entries()];
}

function getProjectPlanConfig(projectName) {
  return projectPlanConfigs[getProjectPlanKey(projectName)] || null;
}

function getProjectPlanKey(projectName) {
  if (projectPlanConfigs[projectName]) return projectName;
  const key = getUnitLookupKey(projectName);
  if (key.includes("chodthanawat1") || key.includes("chod1") || key.includes("km1")) return PROJECT_CHOD1;
  if (key.includes("chodthanawat3") || key.includes("chod3") || key.includes("rama2")) return PROJECT_CHOD3;
  if (key.includes("chodthanawat5") || key.includes("chod5")) return PROJECT_CHOD5;
  if (key.includes("chodthanawat2") || key.includes("chod2") || key.includes("km16")) return PROJECT_CHOD2;
  return projectName;
}

function getFallbackPlanConfig() {
  return getProjectPlanConfig(PROJECT_CHOD2);
}

function getActivePlanConfig() {
  return getProjectPlanConfig(els.projectFilter.value) || getFallbackPlanConfig();
}

function applyPlanImage(planConfig) {
  if (planConfig.layerTransform) {
    els.unitLayer.setAttribute("transform", planConfig.layerTransform);
  } else {
    els.unitLayer.removeAttribute("transform");
  }

  Object.entries(planConfig.image).forEach(([key, value]) => {
    if (key === "transform" && !value) {
      els.masterPlanImage.removeAttribute("transform");
      return;
    }
    els.masterPlanImage.setAttribute(key, value);
  });
}

function setMapDisplayMode(mode) {
  const showPlan = mode === "plan";
  els.masterPlanImage.hidden = !showPlan;
  els.allProjectDashboard.hidden = mode !== "aggregate";
  els.projectPlanPending.hidden = mode !== "pending";
  els.unitLayer.innerHTML = showPlan ? els.unitLayer.innerHTML : "";
  els.unitLabelLayer.innerHTML = showPlan ? els.unitLabelLayer.innerHTML : "";
  els.fitVisibleBtn.disabled = !showPlan;
  els.mapViewport.classList.toggle("is-state-view", !showPlan);

  if (!showPlan) {
    els.unitLayer.removeAttribute("transform");
    els.unitLabelLayer.removeAttribute("transform");
    els.unitMap.setAttribute("viewBox", getPlanDefaultViewBox(getFallbackPlanConfig()));
    els.mapViewport.classList.remove("is-zoomed");
    els.mapViewport.scrollLeft = 0;
    els.mapViewport.scrollTop = 0;
    els.fitVisibleBtn.textContent = "Fit Visible";
  }
}

function renderProjectPlanPending(projectName) {
  els.projectPlanPending.innerHTML = `
    <div class="pending-plan-panel">
      <span>PLAN FILE PENDING</span>
      <strong>${escapeHtml(projectName)}</strong>
      <small>Upload this project's master plan file later to enable an interactive unit map.</small>
    </div>
  `;
}

function renderAllProjectDashboard() {
  const rowsByProject = new Map(projectSheets.map((projectName) => [projectName, []]));
  filteredRows.forEach((row) => {
    if (!rowsByProject.has(row.project)) rowsByProject.set(row.project, []);
    rowsByProject.get(row.project).push(row);
  });

  const projects = [...rowsByProject.entries()].filter(([projectName, rows]) => projectName && (rows.length || projectSheets.includes(projectName)));
  const total = filteredRows.length;
  const occupied = filteredRows.filter((row) => row.status === "Occupied").length;
  const available = filteredRows.filter((row) => row.status === "Available").length;
  const underConstruction = filteredRows.filter((row) => row.status === "Under Construction").length;
  const occupancy = total ? (occupied / total) * 100 : 0;

  els.allProjectDashboard.innerHTML = `
    <div class="aggregate-head">
      <div>
        <span>ALL PROJECTS</span>
        <strong>Occupancy Overview</strong>
      </div>
      <div class="aggregate-donut" style="--occupied:${Math.min(100, Math.max(0, occupancy))}">
        <b>${formatPercent(occupancy)}%</b>
        <small>OCCUPIED</small>
      </div>
    </div>
    <div class="aggregate-metrics">
      <article><span>Total Units</span><strong>${formatNumber(total)}</strong></article>
      <article><span>Available</span><strong>${formatNumber(available)}</strong></article>
      <article><span>Occupied</span><strong>${formatNumber(occupied)}</strong></article>
      <article><span>Under Construction</span><strong>${formatNumber(underConstruction)}</strong></article>
    </div>
    <div class="project-chart-grid">
      ${projects.map(([projectName, rows]) => renderProjectOccupancyChart(projectName, rows)).join("")}
    </div>
  `;
}

function renderProjectOccupancyChart(projectName, rows) {
  const total = rows.length;
  const occupied = rows.filter((row) => row.status === "Occupied").length;
  const available = rows.filter((row) => row.status === "Available").length;
  const underConstruction = rows.filter((row) => row.status === "Under Construction").length;
  const occupancy = total ? (occupied / total) * 100 : 0;
  const availableRate = total ? (available / total) * 100 : 0;
  const constructionRate = total ? (underConstruction / total) * 100 : 0;
  return `
    <article class="project-chart-card">
      <header>
        <strong>${escapeHtml(projectName)}</strong>
        <span>${formatNumber(total)} units</span>
      </header>
      <div class="project-bar-stack" aria-label="${escapeHtml(projectName)} occupancy chart">
        <i class="bar-occupied" style="width:${Math.min(100, Math.max(0, occupancy))}%"></i>
        <i class="bar-available" style="width:${Math.min(100, Math.max(0, availableRate))}%"></i>
        <i class="bar-construction" style="width:${Math.min(100, Math.max(0, constructionRate))}%"></i>
      </div>
      <footer>
        <span><b class="dot-occupied"></b>${formatPercent(occupancy)}% Occupied</span>
        <span><b class="dot-available"></b>${formatPercent(availableRate)}% Available</span>
        <span><b class="dot-construction"></b>${formatPercent(constructionRate)}% Construction</span>
      </footer>
    </article>
  `;
}

function renderMapHealth() {
  const planConfig = getActivePlanConfig();
  const project = els.projectFilter.value;
  const layoutIds = new Set(planConfig.units.flatMap((unit) => [getUnitLookupKey(unit.unitId), getUnitLookupKey(unit.unitNo)].filter(Boolean)));
  const dataIds = new Set(unitRows.filter((row) => rowMatchesProject(row, project)).flatMap(getRowUnitKeys));
  const mappedIds = [...dataIds].filter((unitId) => layoutIds.has(unitId));
  const dataOnlyIds = [...dataIds].filter((unitId) => !layoutIds.has(unitId));
  const shapeOnlyIds = [...layoutIds].filter((unitId) => !dataIds.has(unitId));

  const issues = [
    dataOnlyIds.length ? `Data rows without SVG shape: ${dataOnlyIds.join(", ")}` : "",
    shapeOnlyIds.length ? `SVG shapes without data row: ${shapeOnlyIds.join(", ")}` : ""
  ].filter(Boolean);

  els.mappingIssues.hidden = !issues.length;
  els.mappingIssues.innerHTML = issues.map((issue) => `<p>${escapeHtml(issue)}</p>`).join("");
}

function fitMapToVisibleUnits() {
  const planConfig = getActivePlanConfig();
  if (mapZoomMode !== "visible") {
    els.unitMap.setAttribute("viewBox", getPlanDefaultViewBox(planConfig));
    els.mapViewport.classList.remove("is-zoomed");
    els.mapViewport.scrollLeft = 0;
    els.mapViewport.scrollTop = 0;
    els.fitVisibleBtn.textContent = "Fit Visible";
    return;
  }

  const visibleIds = new Set(filteredRows.flatMap(getRowUnitKeys));
  const visibleUnits = planConfig.units.filter((unit) => visibleIds.has(getUnitLookupKey(unit.unitId)) || visibleIds.has(getUnitLookupKey(unit.unitNo)));
  if (!visibleUnits.length) {
    els.unitMap.setAttribute("viewBox", getPlanDefaultViewBox(planConfig));
    els.mapViewport.classList.add("is-zoomed");
    els.fitVisibleBtn.textContent = "Show All";
    return;
  }

  els.unitMap.setAttribute("viewBox", getBoundsViewBox(visibleUnits, planConfig.visiblePadding, 2, planConfig));
  els.mapViewport.classList.add("is-zoomed");
  els.fitVisibleBtn.textContent = "Show All";
}

function getPlanDefaultViewBox(planConfig) {
  return getBoundsViewBox(planConfig.units, planConfig.defaultPadding, 1, planConfig);
}

function getBoundsViewBox(units, padding, zoom = 1, planConfig = getFallbackPlanConfig()) {
  if (!units.length) return `0 0 ${roundViewBox(planConfig.mapWidth)} ${roundViewBox(planConfig.mapHeight)}`;
  const bounds = units.map((unit) => getDisplayUnitBounds(unit, planConfig));
  const minX = Math.max(0, Math.min(...bounds.map((bound) => bound.minX)) - padding);
  const minY = Math.max(0, Math.min(...bounds.map((bound) => bound.minY)) - padding);
  const maxX = Math.min(planConfig.mapWidth, Math.max(...bounds.map((bound) => bound.maxX)) + padding);
  const maxY = Math.min(planConfig.mapHeight, Math.max(...bounds.map((bound) => bound.maxY)) + padding);
  const width = Math.max(240, (maxX - minX) / zoom);
  const height = Math.max(160, (maxY - minY) / zoom);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const x = Math.min(Math.max(0, centerX - width / 2), planConfig.mapWidth - width);
  const y = Math.min(Math.max(0, centerY - height / 2), planConfig.mapHeight - height);
  return `${roundViewBox(x)} ${roundViewBox(y)} ${roundViewBox(width)} ${roundViewBox(height)}`;
}

function getDisplayUnitBounds(unit, planConfig) {
  if (unit.points?.length) {
    const points = unit.points.map(([x, y]) => getDisplayPoint({ x, y }, planConfig));
    return {
      minX: Math.min(...points.map((point) => point.x)),
      minY: Math.min(...points.map((point) => point.y)),
      maxX: Math.max(...points.map((point) => point.x)),
      maxY: Math.max(...points.map((point) => point.y))
    };
  }

  if (planConfig.rotation === "clockwise90MirrorX") {
    return {
      minX: planConfig.mapWidth - unit.y - unit.height,
      minY: planConfig.mapHeight - unit.x - unit.width,
      maxX: planConfig.mapWidth - unit.y,
      maxY: planConfig.mapHeight - unit.x
    };
  }

  if (planConfig.rotation === "clockwise90") {
    return {
      minX: planConfig.mapWidth - unit.y - unit.height,
      minY: unit.x,
      maxX: planConfig.mapWidth - unit.y,
      maxY: unit.x + unit.width
    };
  }

  if (planConfig.rotation === "counterClockwise90") {
    return {
      minX: unit.y,
      minY: planConfig.mapHeight - unit.x - unit.width,
      maxX: unit.y + unit.height,
      maxY: planConfig.mapHeight - unit.x
    };
  }

  return {
    minX: unit.x,
    minY: unit.y,
    maxX: unit.x + unit.width,
    maxY: unit.y + unit.height
  };
}

function getDisplayPoint(point, planConfig) {
  if (planConfig.rotation === "clockwise90MirrorX") {
    return {
      x: planConfig.mapWidth - point.y,
      y: planConfig.mapHeight - point.x
    };
  }

  if (planConfig.rotation === "clockwise90") {
    return {
      x: planConfig.mapWidth - point.y,
      y: point.x
    };
  }

  if (planConfig.rotation === "counterClockwise90") {
    return {
      x: point.y,
      y: planConfig.mapHeight - point.x
    };
  }

  return point;
}

function roundViewBox(value) {
  return Math.round(value * 100) / 100;
}

function renderMetrics() {
  const counts = Object.fromEntries(Object.keys(statusConfig).map((status) => [status, filteredRows.filter((row) => row.status === status).length]));
  const total = filteredRows.length;
  const occupied = counts.Occupied || 0;
  els.totalUnits.textContent = filteredRows.length;
  els.availableUnits.textContent = counts.Available || 0;
  els.soldUnits.textContent = occupied;
  els.readyUnits.textContent = counts["Under Construction"] || 0;
  els.occupancyRate.textContent = total ? formatPercent((occupied / total) * 100) : "0";
}

function renderTable() {
  els.unitTable.innerHTML = filteredRows
    .map((row) => {
      const color = statusConfig[row.status]?.color || "#94a3b8";
      return `
        <tr data-unit-id="${escapeHtml(row.unitId)}">
          <td><strong>${escapeHtml(row.unitNo)}</strong></td>
          <td>${escapeHtml(row.block)}</td>
          <td>${escapeHtml(row.unitType)}</td>
          <td>${formatArea(row.warehouseArea ?? row.area)}</td>
          <td><span class="status-pill" style="background:${color}">${escapeHtml(row.status)}</span></td>
          <td>${escapeHtml(row.customer || "-")}</td>
          <td>${escapeHtml(row.transferDate || "-")}</td>
          <td>${escapeHtml(row.owner || "-")}</td>
        </tr>
      `;
    })
    .join("");

  els.unitTable.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => selectUnit(row.dataset.unitId));
    });
}

function refreshUnitRegister() {
  const url = getConfiguredSheetUrl();
  if (isGoogleSheetUrl(url)) {
    connectSheetUrl(url);
    return;
  }

  applyFilters();
  updateClock();
  setDataStatus("Unit register refreshed from current local data. Google Sheet URL is not configured.", true);
}

function exportVisibleUnitsCsv() {
  if (!filteredRows.length) {
    setDataStatus("No visible units to export.", true);
    return;
  }

  const columns = [
    ["project", "Project"],
    ["block", "Block"],
    ["unitNo", "Unit"],
    ["unitType", "Type"],
    ["warehouseArea", "Warehouse Area"],
    ["officeArea", "Office Area"],
    ["loadCapacity", "Load Capacity"],
    ["status", "Status"],
    ["customer", "Customer"],
    ["transferDate", "Transfer Date"],
    ["contractTermYears", "Contract Term Years"],
    ["contractEndDate", "Contract End Date"],
    ["owner", "Owner"],
    ["remark", "Remark"]
  ];
  const csv = [
    columns.map(([, label]) => escapeCsvValue(label)).join(","),
    ...filteredRows.map((row) => columns.map(([key]) => escapeCsvValue(row[key] ?? "")).join(","))
  ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const projectName = els.projectFilter.value === "all" ? "all-projects" : els.projectFilter.value;
  link.href = URL.createObjectURL(blob);
  link.download = `warehouse-unit-register-${slugify(projectName)}-${getExportTimestamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setDataStatus(`Exported ${filteredRows.length} visible unit${filteredRows.length === 1 ? "" : "s"} to CSV.`);
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function slugify(value) {
  return String(value || "project").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

function getExportTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function selectUnit(unitId) {
  selectedUnitId = unitId;
  renderMap();
  renderDetail();
}

function clearSelection() {
  if (!selectedUnitId) return;
  selectedUnitId = null;
  renderMap();
  renderDetail();
}

function handleMapClick(event) {
  if (event.target.closest(".unit-group")) return;
  clearSelection();
}

function handlePageClick(event) {
  if (!selectedUnitId) return;
  if (event.target.closest(".unit-group, #detailCard, #unitTable tr, button, input, select, label")) return;
  clearSelection();
}

function renderDetail() {
  const selectedProject = els.projectFilter.value;
  const row = unitRows.find((item) => rowMatchesUnit(item, selectedUnitId) && rowMatchesProject(item, selectedProject))
    || unitRows.find((item) => rowMatchesUnit(item, selectedUnitId));
  els.detailCard.dataset.mode = dashboardMode;
  if (!row) {
    els.detailCard.hidden = true;
    els.detailCard.classList.remove("is-open");
    els.detailTitle.textContent = "Select a unit";
    [
      "detailStatus",
      "detailPhase",
      "detailArea",
      "detailOfficeArea",
      "detailLoadCapacity",
      "detailCustomer",
      "detailTransfer",
      "detailContractTerm",
      "detailContractEnd"
    ].forEach((key) => {
      els[key].textContent = "-";
    });
    return;
  }

  els.detailCard.hidden = false;
  els.detailCard.classList.add("is-open");
  const color = statusConfig[row.status]?.color || "#94a3b8";
  els.detailTitle.textContent = row.unitNo;
  els.detailStatus.innerHTML = `<span class="status-pill" style="background:${color}">${escapeHtml(row.status)}</span>`;
  els.detailPhase.textContent = row.block;
  els.detailArea.textContent = formatArea(row.warehouseArea ?? row.area);
  els.detailOfficeArea.textContent = formatArea(row.officeArea);
  els.detailLoadCapacity.textContent = formatLoadCapacity(row.loadCapacity);
  els.detailCustomer.textContent = row.customer || "-";
  els.detailTransfer.textContent = row.transferDate || "-";
  els.detailContractTerm.textContent = formatContractTerm(row.contractTermYears);
  els.detailContractEnd.textContent = row.contractEndDate || calculateContractEndDate(row.transferDate, row.contractTermYears) || "-";
}

function clearFilters() {
  els.projectFilter.value = "all";
  els.phaseFilter.value = "all";
  els.statusFilter.value = "all";
  els.searchBox.value = "";
  applyFilters();
}

function toggleMapZoom() {
  mapZoomMode = mapZoomMode === "all" ? "visible" : "all";
  renderMap();
}

function updateClock() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(now).replace(/ /g, "-");
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
  els.lastUpdated.textContent = `${date} ${time}`;
}

function setDashboardMode(mode) {
  dashboardMode = mode === "op" ? "op" : "marketing";
  document.body.dataset.mode = dashboardMode;
  els.controlTitle.textContent = dashboardMode === "op" ? "OPERATION CONTROL" : "MARKETTING CONTROL";
  els.modeButtons.forEach((button) => {
    const selected = button.dataset.mode === dashboardMode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  renderDetail();
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function mapCsvRows(rows) {
  const [header, ...body] = rows;
  const keys = header.map((key) => normalize(key));
  return body.map((line) => {
    const row = Object.fromEntries(keys.map((key, index) => [key, line[index] || ""]));
    return {
      unitId: row.unitid || row["unit layout id"] || row["layoutid"] || row.id || row.unitno || row.unit || row["unit number"],
      project: row.project || PROJECT_NAME,
      phase: row.phase || row.block,
      block: row.block,
      unitNo: row.unitno || row.unit || row["unit number"],
      unitType: row.unittype || row.type || row["unit type"],
      warehouseArea: Number(row.warehousearea || row["warehouse area"] || row.area || 0),
      officeArea: Number(row.officearea || row["office area"] || 0),
      loadCapacity: parseOptionalNumber(row.loadcapacity || row["load capacity"] || ""),
      area: Number(row.warehousearea || row["warehouse area"] || row.area || 0),
      price: Number(row.price || row.sellingprice || row["selling price"] || 0),
      status: normalizeStatus(row.status),
      progress: Number(row.progress || row.constructionprogress || row["construction progress"] || 0),
      customer: row.customer || row.ownername || "",
      contractDate: row.contractdate || row["contract date"] || "",
      transferDate: row.transferdate || row["transfer date"] || "",
      contractTermYears: Number(row.contracttermyears || row["contract term years"] || row.contractterm || row["contract term"] || 0),
      contractEndDate: row.contractenddate || row["contract end date"] || calculateContractEndDate(row.transferdate || row["transfer date"], row.contracttermyears || row["contract term years"] || row.contractterm || row["contract term"]),
      defectStatus: row.defectstatus || row["defect status"] || "",
      paymentStatus: row.paymentstatus || row["payment status"] || "",
      owner: row.owner || row.responsible || "",
      remark: row.remark || ""
    };
  }).filter((row) => row.unitId && row.unitNo);
}

function mapObjectRows(rows, fallbackProject = PROJECT_NAME) {
  return rows.map((source) => {
    const row = Object.fromEntries(Object.entries(source).map(([key, value]) => [normalize(key).replace(/\s/g, ""), value]));
    const transferDate = row.transferdate || "";
    const contractTermYears = row.contracttermyears || row.contractterm || "";
    return {
      unitId: row.unitid || row.unitlayoutid || row.layoutid || row.id || row.unitno || row.unit || row.unitnumber,
      project: fallbackProject || row.project || PROJECT_NAME,
      phase: row.phase || row.block,
      block: row.block,
      unitNo: row.unitno || row.unit || row.unitnumber || row.unitid,
      unitType: row.unittype || row.type || "Factory/Warehouse",
      warehouseArea: Number(row.warehousearea || row.area || 0),
      officeArea: Number(row.officearea || 0),
      loadCapacity: parseOptionalNumber(row.loadcapacity || ""),
      area: Number(row.warehousearea || row.area || 0),
      status: normalizeStatus(row.status),
      customer: row.customer || row.ownername || "",
      transferDate,
      contractTermYears: Number(contractTermYears || 0),
      contractEndDate: row.contractenddate || calculateContractEndDate(transferDate, contractTermYears),
      owner: row.owner || row.responsible || "",
      remark: row.remark || ""
    };
  }).filter((row) => row.unitId && row.unitNo);
}

function normalizeStatus(value) {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();
  if (lower === "sold" || lower === "reserved" || lower === "occupied") return "Occupied";
  if (lower === "defect / risk" || lower === "defect/risk" || lower === "ready to transfer" || lower === "overdue payment" || lower === "under construction") return "Under Construction";
  return Object.keys(statusConfig).find((status) => status.toLowerCase() === text.toLowerCase()) || "Available";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value || 0);
}

function formatArea(value) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0)} sq.m.`;
}

function formatPercent(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function formatLoadCapacity(value) {
  const capacity = Number(value || 0);
  if (!capacity) return "-";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(capacity)} Ton/Sq.m.`;
}

function formatContractTerm(value) {
  const years = Number(value || 0);
  return years ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(years)} years` : "-";
}

function parseOptionalNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : "";
}

function calculateContractEndDate(transferDate, contractTermYears) {
  const years = Number(contractTermYears || 0);
  if (!transferDate || !years) return "";
  const date = new Date(transferDate);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + Math.round(years * 12));
  return date.toISOString().slice(0, 10);
}

function formatCadPoint(unit) {
  if (!unit) return "-";
  return `X ${formatCoord(unit.cadX)} / Y ${formatCoord(unit.cadY)} / Z ${formatCoord(unit.cadZ)}`;
}

function formatCoord(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value || 0);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function isGoogleSheetUrl(value) {
  return /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[-\w]+/i.test(String(value || "").trim());
}

function getGoogleSheetId(url) {
  return (url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) || [])[1];
}

function getStoredSheetUrl() {
  try {
    return localStorage.getItem(SHEET_URL_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function storeSheetUrl(url) {
  try {
    localStorage.setItem(SHEET_URL_STORAGE_KEY, url);
  } catch (error) {
    // Ignore storage failures in local file contexts.
  }
}

function getConfiguredSheetUrl() {
  const currentUrl = els.sheetUrlInput.value.trim();
  const storedUrl = getStoredSheetUrl().trim();
  return currentUrl || storedUrl || DEFAULT_GOOGLE_SHEET_URL;
}

function initializeSheetSource() {
  const url = getConfiguredSheetUrl();
  if (isGoogleSheetUrl(url)) {
    els.sheetUrlInput.value = url;
    setDataStatus("Ready. Press Refresh to sync the configured Google Sheet.");
  }
}

async function connectSheetUrl(sourceUrl = getConfiguredSheetUrl()) {
  const url = typeof sourceUrl === "string" ? sourceUrl.trim() : getConfiguredSheetUrl();
  if (!isGoogleSheetUrl(url)) {
    setDataStatus("Paste a valid Google Sheet URL only.", true);
    els.sheetUrlInput.focus();
    return;
  }
  els.sheetUrlInput.value = url;
  try {
    setDataStatus("Syncing Google Sheet...");
    const sheetNames = await loadGoogleSheetNames(url).catch(() => PROJECT_SHEETS);
    const uniqueSheetNames = uniquePreserveOrder(sheetNames.length ? sheetNames : PROJECT_SHEETS);
    const results = await Promise.allSettled(uniqueSheetNames.map(async (sheetName) => {
      const rows = await loadGoogleSheetRows(url, sheetName);
      return { sheetName, rows: mapObjectRows(rows, sheetName) };
    }));
    const synced = results
      .filter((result) => result.status === "fulfilled" && result.value.rows.length)
      .map((result) => result.value);
    if (!synced.length) throw new Error("No unit rows found");

    projectSheets = uniqueSheetNames;
    unitRows = mergePlannedFallbackRows(synced.flatMap((item) => item.rows));
    selectedUnitId = null;
    storeSheetUrl(url);
    render();
    setDataStatus(`Synced ${unitRows.length} units from ${synced.length} active project sheet${synced.length === 1 ? "" : "s"}; ${projectSheets.length} sheet tab${projectSheets.length === 1 ? "" : "s"} loaded into Project filter.`);
  } catch (error) {
    console.error(error);
    setDataStatus("Unable to sync. Share the sheet as Anyone with the link: Viewer, then paste the normal Google Sheet URL.", true);
  }
}

function loadGoogleSheetNames(url) {
  return new Promise((resolve, reject) => {
    const sheetId = getGoogleSheetId(url);
    if (!sheetId) {
      reject(new Error("Invalid Google Sheet URL"));
      return;
    }

    const callbackName = `warehouseSheetNamesCallback_${Date.now()}_${Math.round(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheet tab list timed out"));
    }, 12000);
    const cleanup = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (payload) => {
      try {
        const names = (payload?.feed?.entry || [])
          .map((entry) => cleanSheetValue(entry?.title?.$t))
          .filter(Boolean);
        if (!names.length) throw new Error("No sheet tabs found");
        resolve(names);
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Google Sheet tab list failed"));
    };
    script.src = `https://spreadsheets.google.com/feeds/worksheets/${sheetId}/public/basic?alt=json-in-script&callback=${callbackName}&cacheBust=${Date.now()}`;
    document.body.appendChild(script);
  });
}

function loadGoogleSheetRows(url, sheetName) {
  return new Promise((resolve, reject) => {
    const sheetId = getGoogleSheetId(url);
    if (!sheetId) {
      reject(new Error("Invalid Google Sheet URL"));
      return;
    }

    const callbackName = `warehouseSheetCallback_${Date.now()}_${Math.round(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Google Sheet sync timed out: ${sheetName}`));
    }, 12000);
    const cleanup = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (payload) => {
      try {
        resolve(googleVizToRows(payload));
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error(`Google Sheet script load failed: ${sheetName}`));
    };
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&sheet=${encodeURIComponent(sheetName)}&cacheBust=${Date.now()}`;
    document.body.appendChild(script);
  });
}

function googleVizToRows(payload) {
  const table = payload?.table;
  if (!table?.cols?.length) return [];
  let headers = table.cols.map((col, index) => cleanSheetValue(col.label || col.id || `Column ${index + 1}`));
  let rows = (table.rows || []).map((row) => headers.map((_, index) => {
    const cell = row.c?.[index];
    return cleanSheetValue(cell?.v ?? cell?.f ?? "");
  }));

  if (isGenericSheetHeaders(headers) && rows.length && looksLikeHeaderRow(rows[0])) {
    headers = rows[0];
    rows = rows.slice(1);
  }

  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function cleanSheetValue(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const dateMatch = String(value ?? "").match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return new Date(Number(year), Number(month), Number(day)).toISOString().slice(0, 10);
  }
  return String(value ?? "").trim();
}

function isGenericSheetHeaders(headers) {
  return headers.every((header, index) => {
    const normalized = normalize(header);
    return normalized === `column ${index + 1}` || normalized === String.fromCharCode(97 + index) || normalized === `col${index + 1}`;
  });
}

function looksLikeHeaderRow(row) {
  const knownHeaders = new Set([
    "project",
    "block",
    "unitno",
    "unit number",
    "unittype",
    "unit type",
    "warehousearea",
    "warehouse area",
    "officearea",
    "office area",
    "loadcapacity",
    "load capacity",
    "status",
    "customer",
    "transferdate",
    "transfer date",
    "contracttermyears",
    "contract term years",
    "contractenddate",
    "contract end date",
    "owner",
    "remark"
  ]);
  return row.filter((cell) => knownHeaders.has(normalize(cell).replace(/\s/g, "")) || knownHeaders.has(normalize(cell))).length >= 3;
}

function startViewportDrag(event) {
  if (event.button !== 1) return;
  event.preventDefault();
  mapDragState = {
    x: event.clientX,
    y: event.clientY,
    scrollLeft: els.mapViewport.scrollLeft,
    scrollTop: els.mapViewport.scrollTop
  };
  els.mapViewport.classList.add("is-dragging");
}

function dragViewport(event) {
  if (!mapDragState) return;
  event.preventDefault();
  els.mapViewport.scrollLeft = mapDragState.scrollLeft - (event.clientX - mapDragState.x);
  els.mapViewport.scrollTop = mapDragState.scrollTop - (event.clientY - mapDragState.y);
}

function handleViewportWheel(event) {
  if (mapZoomMode !== "visible") return;
  if (event.shiftKey && !event.deltaX) {
    event.preventDefault();
    els.mapViewport.scrollLeft += event.deltaY;
    return;
  }
  if (event.deltaX) {
    event.preventDefault();
    els.mapViewport.scrollLeft += event.deltaX;
    els.mapViewport.scrollTop += event.deltaY;
  }
}

function stopViewportDrag() {
  if (!mapDragState) return;
  mapDragState = null;
  els.mapViewport.classList.remove("is-dragging");
}

els.sheetUrlInput.addEventListener("paste", (event) => {
  const pasted = event.clipboardData?.getData("text") || "";
  if (!isGoogleSheetUrl(pasted)) {
    event.preventDefault();
    setDataStatus("Only Google Sheet URLs can be pasted here.", true);
  }
});

els.connectSheetBtn.addEventListener("click", () => connectSheetUrl());
els.refreshRegisterBtn.addEventListener("click", refreshUnitRegister);
els.exportCsvBtn.addEventListener("click", exportVisibleUnitsCsv);
els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setDashboardMode(button.dataset.mode));
});

[els.projectFilter, els.phaseFilter, els.statusFilter].forEach((select) => select.addEventListener("change", applyFilters));
els.searchBox.addEventListener("input", applyFilters);
els.clearFiltersBtn.addEventListener("click", clearFilters);
els.fitVisibleBtn.addEventListener("click", toggleMapZoom);
els.unitMap.addEventListener("click", handleMapClick);
els.mapViewport.addEventListener("mousedown", startViewportDrag);
els.mapViewport.addEventListener("wheel", handleViewportWheel, { passive: false });
els.mapViewport.addEventListener("auxclick", (event) => {
  if (event.button === 1) event.preventDefault();
});
document.addEventListener("click", handlePageClick);
document.addEventListener("mousemove", dragViewport);
document.addEventListener("mouseup", stopViewportDrag);
setInterval(updateClock, 1000);

initializeSheetSource();
setDashboardMode("marketing");
render();
connectSheetUrl().catch((error) => console.error(error));
