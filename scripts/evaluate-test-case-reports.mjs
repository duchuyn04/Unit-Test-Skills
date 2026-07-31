import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function field(block, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`^-\\s+\\*\\*${label}:\\*\\*\\s*(.+)$`, "im");
    const value = block.match(pattern)?.[1].trim();
    if (value) return value;
  }
  return "";
}

function cleanInlineCode(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("`") && trimmed.endsWith("`")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

export function parseReport(content) {
  const headings = [...content.matchAll(/^###\s+\d+\.\s+([^\r\n]+)$/gm)];
  return headings.map((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? content.length;
    const block = content.slice(start, end);
    return {
      name: cleanInlineCode(heading[1]),
      type: cleanInlineCode(field(block, ["Loại", "Type"])),
      evidence: field(block, ["Căn cứ kỳ vọng", "Expected basis"]),
    };
  });
}

function findCase(cases, requirement) {
  if (requirement.name) {
    return cases.find((testCase) => testCase.name === requirement.name);
  }
  const pattern = new RegExp(requirement.namePattern, "i");
  return cases.find((testCase) => pattern.test(testCase.name));
}

function hasIndependentEvidence(evidence) {
  return /(?:^|[\s`])[^\s`]+\.(?:cs|json|md|xml|ya?ml):\d+/i.test(evidence) ||
    /Người dùng xác nhận:/i.test(evidence);
}

export function evaluateReport(manifest, content) {
  const errors = [];
  const cases = parseReport(content);
  const normalizedNames = cases.map((testCase) => testCase.name.toLowerCase());
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    errors.push("có test case trùng tên");
  }

  if (manifest.minimumCaseCount !== undefined && cases.length < manifest.minimumCaseCount) {
    errors.push(`chỉ có ${cases.length} test case, cần ít nhất ${manifest.minimumCaseCount}`);
  }
  if (manifest.maximumCaseCount !== undefined && cases.length > manifest.maximumCaseCount) {
    errors.push(`có ${cases.length} test case, tối đa ${manifest.maximumCaseCount}`);
  }

  for (const requirement of manifest.required ?? []) {
    const testCase = findCase(cases, requirement);
    const label = requirement.name ?? `/${requirement.namePattern}/`;
    if (!testCase) {
      errors.push(`thiếu ${label}`);
      continue;
    }
    if (requirement.type && testCase.type.toLowerCase() !== requirement.type.toLowerCase()) {
      errors.push(`${testCase.name}: loại '${testCase.type}' thay vì '${requirement.type}'`);
    }
    for (const expectedEvidence of requirement.evidenceIncludes ?? []) {
      if (!testCase.evidence.includes(expectedEvidence)) {
        errors.push(`${testCase.name}: căn cứ không chứa '${expectedEvidence}'`);
      }
    }
  }

  for (const testCase of cases) {
    if (["contract", "regression"].includes(testCase.type.toLowerCase()) &&
        !hasIndependentEvidence(testCase.evidence)) {
      errors.push(`${testCase.name}: Contract/Regression thiếu căn cứ có thể truy vết`);
    }
  }

  for (const source of manifest.forbiddenNamePatterns ?? []) {
    const pattern = new RegExp(source, "i");
    for (const testCase of cases.filter((item) => pattern.test(item.name))) {
      errors.push(`${testCase.name}: khớp forbidden pattern /${source}/`);
    }
  }

  for (const source of manifest.requiredTextPatterns ?? []) {
    if (!new RegExp(source, "i").test(content)) {
      errors.push(`report thiếu nội dung /${source}/`);
    }
  }

  return { cases, errors };
}

function main() {
  const repositoryRoot = process.cwd();
  const casesRoot = path.join(repositoryRoot, "evals", "cases");
  const resultsRoot = path.resolve(repositoryRoot, process.argv[2] ?? "evals/results");
  const manifests = fs
    .readdirSync(casesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => JSON.parse(fs.readFileSync(path.join(casesRoot, entry.name, "eval.json"), "utf8")))
    .sort((left, right) => left.id.localeCompare(right.id));

  const failures = [];
  for (const manifest of manifests) {
    const reportPath = path.join(resultsRoot, `${manifest.id}.md`);
    if (!fs.existsSync(reportPath)) {
      failures.push(`${manifest.id}: thiếu report ${path.relative(repositoryRoot, reportPath)}`);
      continue;
    }
    const result = evaluateReport(manifest, fs.readFileSync(reportPath, "utf8"));
    if (result.errors.length === 0) {
      console.log(`PASS ${manifest.id} (${result.cases.length} cases)`);
    } else {
      for (const error of result.errors) failures.push(`${manifest.id}: ${error}`);
    }
  }

  if (failures.length > 0) {
    console.error("Behavioral evaluation failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Behavioral evaluation passed: ${manifests.length}/${manifests.length} fixtures.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
