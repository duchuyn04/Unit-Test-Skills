import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repositoryRoot = process.cwd();
const skillsRoot = path.join(repositoryRoot, "skills");
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

if (errors.length > 0) {
  console.error("Skill validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Skill validation passed.");
