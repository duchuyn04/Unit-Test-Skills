import assert from "node:assert/strict";
import { evaluateReport, parseReport } from "./evaluate-test-case-reports.mjs";

const validReport = `
### 1. Calculate_AtBoundary_ReturnsDiscount
- **Căn cứ kỳ vọng:** CONTRACT.md:5
- **Loại:** Regression
`;
const manifest = {
  minimumCaseCount: 1,
  maximumCaseCount: 1,
  required: [{
    name: "Calculate_AtBoundary_ReturnsDiscount",
    type: "Regression",
    evidenceIncludes: ["CONTRACT.md:5"],
  }],
  forbiddenNamePatterns: ["Null"],
};

assert.equal(parseReport(validReport).length, 1);
assert.deepEqual(evaluateReport(manifest, validReport).errors, []);

const englishLabels = `
### 1. \`Calculate_AtBoundary_ReturnsDiscount\`
- **Expected basis:** \`CONTRACT.md:5\`
- **Type:** Contract
`;
assert.equal(parseReport(englishLabels)[0].name, "Calculate_AtBoundary_ReturnsDiscount");
assert.equal(parseReport(englishLabels)[0].type, "Contract");

const invalidReport = `
### 1. Calculate_Null_Throws
- **Căn cứ kỳ vọng:** implementation hiện tại
- **Loại:** Contract
`;
const errors = evaluateReport(manifest, invalidReport).errors.join("\n");
assert.match(errors, /thiếu Calculate_AtBoundary_ReturnsDiscount/);
assert.match(errors, /thiếu căn cứ có thể truy vết/);
assert.match(errors, /forbidden pattern/);

console.log("Behavioral evaluation scorer tests passed.");
