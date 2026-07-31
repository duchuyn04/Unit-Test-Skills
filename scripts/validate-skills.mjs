import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repositoryRoot = process.cwd();
const skillsRoot = path.join(repositoryRoot, "skills");
const evalsRoot = path.join(repositoryRoot, "evals", "cases");
const errors = [];
const allowedFrontmatterKeys = new Set([
  "name",
  "description",
  "allowed-tools",
  "license",
  "metadata",
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function normalize(content) {
  return content.replaceAll("\r\n", "\n").trimEnd();
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function validateSkill(skillDirectoryName) {
  const skillRoot = path.join(skillsRoot, skillDirectoryName);
  const skillFile = path.join(skillRoot, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    errors.push(`${skillDirectoryName}: thiếu SKILL.md`);
    return;
  }

  const content = fs.readFileSync(skillFile, "utf8");
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    errors.push(`${skillDirectoryName}: frontmatter không hợp lệ`);
    return;
  }

  const metadata = new Map();
  for (const line of frontmatterMatch[1].split(/\r?\n/)) {
    if (/^\s/.test(line) || !line.includes(":")) continue;
    const separator = line.indexOf(":");
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    metadata.set(key, value);
    if (!allowedFrontmatterKeys.has(key)) {
      errors.push(`${skillDirectoryName}: frontmatter có key không hỗ trợ '${key}'`);
    }
  }

  const name = unquote(metadata.get("name") ?? "");
  const description = unquote(metadata.get("description") ?? "");
  if (name !== skillDirectoryName) {
    errors.push(`${skillDirectoryName}: name '${name}' không khớp tên thư mục`);
  }
  if (!description) {
    errors.push(`${skillDirectoryName}: thiếu description`);
  }

  const openAiMetadata = path.join(skillRoot, "agents", "openai.yaml");
  if (!fs.existsSync(openAiMetadata)) {
    errors.push(`${skillDirectoryName}: thiếu agents/openai.yaml`);
  } else {
    const openAiContent = fs.readFileSync(openAiMetadata, "utf8");
    if (!openAiContent.includes(`$${skillDirectoryName}`)) {
      errors.push(`${skillDirectoryName}: default_prompt không gọi $${skillDirectoryName}`);
    }
  }
}

function validateGeneralRulesAreSynchronized() {
  const casesRules = path.join(
    skillsRoot,
    "generate-test-cases",
    "rules",
    "general",
  );
  const testsRules = path.join(
    skillsRoot,
    "generate-tests",
    "rules",
    "tests",
    "general",
  );
  const casesFiles = fs.readdirSync(casesRules).sort();
  const testsFiles = fs.readdirSync(testsRules).sort();

  if (casesFiles.join("\n") !== testsFiles.join("\n")) {
    errors.push("Danh sách general rule giữa hai skill không đồng bộ");
    return;
  }

  for (const fileName of casesFiles) {
    const left = normalize(fs.readFileSync(path.join(casesRules, fileName), "utf8"));
    const right = normalize(fs.readFileSync(path.join(testsRules, fileName), "utf8"));
    if (left !== right) {
      errors.push(`General rule không đồng bộ: ${fileName}`);
    }
  }
}

function validateBehavioralEvalFixtures() {
  if (!fs.existsSync(evalsRoot)) {
    errors.push("Thiếu evals/cases/");
    return;
  }
  const fixtureDirectories = fs
    .readdirSync(evalsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (fixtureDirectories.length < 6) {
    errors.push(`Behavioral eval chỉ có ${fixtureDirectories.length} fixture, cần ít nhất 6`);
  }
  for (const fixtureName of fixtureDirectories) {
    const fixtureRoot = path.join(evalsRoot, fixtureName);
    const manifestPath = path.join(fixtureRoot, "eval.json");
    if (!fs.existsSync(manifestPath)) {
      errors.push(`${fixtureName}: thiếu eval.json`);
      continue;
    }
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (error) {
      errors.push(`${fixtureName}: eval.json không hợp lệ (${error.message})`);
      continue;
    }
    if (manifest.id !== fixtureName) errors.push(`${fixtureName}: id trong eval.json không khớp`);
    if (!manifest.target || !fs.existsSync(path.join(fixtureRoot, manifest.target))) {
      errors.push(`${fixtureName}: target không tồn tại '${manifest.target ?? ""}'`);
    }
    for (const requirement of manifest.required ?? []) {
      if (!requirement.name && !requirement.namePattern) {
        errors.push(`${fixtureName}: required case thiếu name hoặc namePattern`);
      }
      if (!requirement.type) errors.push(`${fixtureName}: required case thiếu type`);
      if (!["Characterization", "Contract", "Regression"].includes(requirement.type)) {
        errors.push(`${fixtureName}: loại test không hợp lệ '${requirement.type}'`);
      }
    }
  }
}

if (!fs.existsSync(skillsRoot)) {
  errors.push("Thiếu thư mục skills/");
} else {
  const skillDirectories = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (skillDirectories.length === 0) {
    errors.push("Không tìm thấy skill nào");
  }
  for (const skillDirectory of skillDirectories) {
    validateSkill(skillDirectory);
  }
}

validateGeneralRulesAreSynchronized();
validateBehavioralEvalFixtures();

for (const requiredEvalPath of [
  "scripts/evaluate-test-case-reports.mjs",
  "scripts/test-evaluate-test-case-reports.mjs",
  "scripts/test-generated-test-fixture.mjs",
  "evals/generated-tests/App.Tests/App.Tests.csproj",
  "evals/generated-tests/App.Tests/DiscountPolicyTests.cs",
  "evals/generated-tests/App.Mutant/DiscountPolicy.cs",
]) {
  if (!fs.existsSync(path.join(repositoryRoot, requiredEvalPath))) {
    errors.push(`Thiếu generated-test evaluation artifact: ${requiredEvalPath}`);
  }
}

const allSkillContent = normalize(
  read("skills/generate-test-cases/SKILL.md") +
    read("skills/generate-tests/SKILL.md"),
);
if (allSkillContent.includes("IllegalArgumentException")) {
  errors.push("SKILL.md còn chứa IllegalArgumentException của Java");
}
if (allSkillContent.includes("AskUserQuestion")) {
  errors.push("SKILL.md còn phụ thuộc cứng vào AskUserQuestion");
}
if (!read("skills/generate-test-cases/SKILL.md").includes("./rules/csharp/xunit.md")) {
  errors.push("generate-test-cases chưa tham chiếu rule C# xUnit");
}
for (const skillName of ["generate-test-cases", "generate-tests"]) {
  const skillContent = read(`skills/${skillName}/SKILL.md`);
  if (!skillContent.includes("contract-first-bug-discovery.md")) {
    errors.push(`${skillName} chưa tham chiếu contract-first-bug-discovery.md`);
  }
  if (!skillContent.includes("Căn cứ kỳ vọng")) {
    errors.push(`${skillName} chưa yêu cầu ghi căn cứ kỳ vọng`);
  }
}

const contractRule = read(
  "skills/generate-test-cases/rules/general/contract-first-bug-discovery.md",
);
if (!contractRule.includes("đường dẫn tương đối kèm dòng, heading hoặc symbol")) {
  errors.push("Contract rule chưa yêu cầu căn cứ có thể truy vết");
}

const argumentRule = read(
  "skills/generate-test-cases/rules/general/verify-relevant-arguments-only.md",
);
const wrongExample = argumentRule.match(/\*\*Không đúng:\*\*[\s\S]*?```csharp([\s\S]*?)```/)?.[1]?.trim();
const rightExample = argumentRule.match(/\*\*Đúng:\*\*[\s\S]*?```csharp([\s\S]*?)```/)?.[1]?.trim();
if (!wrongExample || !rightExample || wrongExample === rightExample) {
  errors.push("Rule argument matching có ví dụ sai/đúng bị thiếu hoặc trùng nhau");
}

const executionRule = read(
  "skills/generate-tests/rules/tests/post-generation/test-execution-verification.md",
);
if (executionRule.includes("Không bàn giao test đang fail")) {
  errors.push("Quy tắc hậu kiểm vẫn cấm mọi regression test fail");
}
if (!executionRule.includes("regression test đang fail")) {
  errors.push("Quy tắc hậu kiểm chưa cho phép giữ regression test fail có căn cứ");
}
if (!executionRule.includes("FULL_SUITE_NOT_VERIFIED") ||
    !executionRule.includes("luôn chạy toàn test project")) {
  errors.push("Quy tắc hậu kiểm chưa bắt buộc full-suite comparison");
}

const effectivenessRulePath =
  "skills/generate-tests/rules/tests/post-generation/test-effectiveness-verification.md";
if (!fs.existsSync(path.join(repositoryRoot, effectivenessRulePath)) ||
    !read(effectivenessRulePath).includes("EFFECTIVENESS_NOT_MEASURED")) {
  errors.push("Thiếu rule xác minh test effectiveness");
}

const generateTestsSkill = read("skills/generate-tests/SKILL.md");
const safetyRulePath =
  "skills/generate-tests/rules/tests/safety/production-code-write-boundary.md";
const boundaryScriptPath =
  "skills/generate-tests/scripts/production-write-boundary.mjs";

if (!fs.existsSync(path.join(repositoryRoot, safetyRulePath))) {
  errors.push("generate-tests thiếu production-code-write-boundary.md");
} else {
  const safetyRule = read(safetyRulePath);
  for (const requiredText of [
    "Production code luôn ở chế độ chỉ đọc",
    "TESTABILITY_BLOCKER",
    "WRITE_BOUNDARY_VIOLATION",
    "Không tự động revert",
  ]) {
    if (!safetyRule.includes(requiredText)) {
      errors.push(`Safety rule thiếu invariant: ${requiredText}`);
    }
  }
}

if (!fs.existsSync(path.join(repositoryRoot, boundaryScriptPath))) {
  errors.push("generate-tests thiếu production-write-boundary.mjs");
} else if (!read(boundaryScriptPath).includes("collectIgnoredPolicyPaths")) {
  errors.push("Write boundary chưa theo dõi file source/config bị Git ignore");
}
for (const requiredReference of [
  "safety/production-code-write-boundary.md",
  "scripts/production-write-boundary.mjs",
  "test-effectiveness-verification.md",
  "EFFECTIVENESS_NOT_MEASURED",
  "TESTABILITY_BLOCKER",
  "WRITE_BOUNDARY_VIOLATION",
]) {
  if (!generateTestsSkill.includes(requiredReference)) {
    errors.push(`generate-tests chưa tích hợp: ${requiredReference}`);
  }
}

if (errors.length > 0) {
  console.error("Skill validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Skill validation passed.");
