global.window = {};
require("../chaengwattana-units.js");

const header = [
  "project",
  "block",
  "unitNo",
  "unitType",
  "warehouseArea",
  "officeArea",
  "loadCapacity",
  "status",
  "customer",
  "transferDate",
  "contractTermYears",
  "contractEndDate",
  "owner",
  "remark"
];

console.log(header.join("\t"));
window.chaengwattanaUnits.forEach((unit, index) => {
  const row = index + 2;
  console.log([
    "CHODBIZ CHAENGWATTANA",
    unit.block,
    unit.unitNo,
    "Factory/Warehouse",
    "",
    "",
    "",
    "Available",
    "",
    "",
    "",
    `=IF(OR(J${row}="",K${row}=""),"",EDATE(J${row},K${row}*12))`,
    "Sales",
    "Extracted from updated Chaengwattana PDF unit text"
  ].join("\t"));
});
