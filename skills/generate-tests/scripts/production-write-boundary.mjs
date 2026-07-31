#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const VERSION = 2;
const SENSITIVE_NAMES = new Set(["directory.packages.props", "nuget.config"]);
const SENSITIVE_EXTENSIONS = new Set([
  ".csproj",
  ".fsproj",
  ".vbproj",
  ".sln",
  ".slnx",
  ".props",
  ".targets",
]);
const IGNORED_WATCH_EXTENSIONS = new Set([
  ".cs",
  ".cshtml",
  ".env",
  ".fs",
  ".json",
  ".props",
  ".razor",
  ".targets",
  ".vb",
  ".xml",
  ".yaml",
  ".yml",
]);
const IGNORED_WATCH_NAMES = new Set([
  ".env",
  "dockerfile",
  "global.json",
  "nuget.config",
]);
const GENERATED_DIRECTORY_NAMES = new Set([
  ".git",
  ".idea",
  ".next",
  ".terraform",
  ".vs",
  ".vscode",
  "artifacts",
  "bin",
  "coverage",
  "dist",
  "node_modules",
  "obj",
  "packages",
  "testresults",
]);

function fail(message, exitCode = 2) {
  console.error(message);
  process.exit(exitCode);
}

function parseArguments(argv) {
  const [mode, ...rest] = argv;
  const values = { mode, testRoots: [], allowedConfig: [] };

  for (let index = 0; index < rest.length; index += 1) {
    const option = rest[index];
    const value = rest[index + 1];
    if (!["--test-root", "--allow-config", "--state"].includes(option)) {
      fail(`Tùy chọn không hỗ trợ: ${option ?? "(trống)"}`);
    }
    if (!value || value.startsWith("--")) fail(`Thiếu giá trị cho ${option}`);
    index += 1;
    if (option === "--test-root") values.testRoots.push(value);
    if (option === "--allow-config") values.allowedConfig.push(value);
    if (option === "--state") values.statePath = value;
  }

  return values;
}

function runGit(repositoryRoot, args) {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function findRepositoryRoot() {
  try {
    return path.resolve(runGit(process.cwd(), ["rev-parse", "--show-toplevel"]).trim());
  } catch {
    fail("Không tìm thấy Git repository. Hãy áp dụng kiểm tra phạm vi ghi thủ công theo safety rule.");
  }
}

function normalizeRepositoryPath(repositoryRoot, inputPath, label) {
  const absolutePath = path.resolve(repositoryRoot, inputPath);
  const relativePath = path.relative(repositoryRoot, absolutePath).replaceAll("\\", "/");
  if (!relativePath || relativePath === ".") fail(`${label} không được là repository root.`);
  if (relativePath === ".." || relativePath.startsWith("../")) {
    fail(`${label} nằm ngoài repository: ${inputPath}`);
  }
  return relativePath;
}

function splitNullTerminated(output) {
  return output.split("\0").filter(Boolean).map((item) => item.replaceAll("\\", "/"));
}

function collectWorkingPaths(repositoryRoot) {
  const commands = [
    ["diff", "--name-only", "-z"],
    ["diff", "--cached", "--name-only", "-z"],
    ["ls-files", "--others", "--exclude-standard", "-z"],
  ];
  const paths = new Set();
  for (const args of commands) {
    for (const filePath of splitNullTerminated(runGit(repositoryRoot, args))) paths.add(filePath);
  }
  for (const filePath of collectIgnoredPolicyPaths(repositoryRoot)) paths.add(filePath);
  return [...paths].sort();
}

function isGeneratedPath(filePath) {
  return filePath
    .toLowerCase()
    .split("/")
    .some((segment) => GENERATED_DIRECTORY_NAMES.has(segment));
}

function isIgnoredWatchCandidate(filePath) {
  if (isGeneratedPath(filePath)) return false;
  const baseName = path.posix.basename(filePath).toLowerCase();
  return baseName.startsWith("appsettings.") ||
    IGNORED_WATCH_NAMES.has(baseName) ||
    IGNORED_WATCH_EXTENSIONS.has(path.posix.extname(baseName));
}

function collectIgnoredPolicyPaths(repositoryRoot) {
  const output = runGit(repositoryRoot, [
    "ls-files",
    "--others",
    "--ignored",
    "--exclude-standard",
    "-z",
  ]);
  return splitNullTerminated(output).filter(isIgnoredWatchCandidate);
}

function currentHead(repositoryRoot) {
  try {
    return runGit(repositoryRoot, ["rev-parse", "--verify", "HEAD"]).trim();
  } catch {
    return "UNBORN";
  }
}

function fingerprint(repositoryRoot, repositoryPath) {
  const absolutePath = path.join(repositoryRoot, ...repositoryPath.split("/"));
  if (!fs.existsSync(absolutePath)) return "MISSING";
  const stat = fs.lstatSync(absolutePath);
  if (stat.isSymbolicLink()) {
    return `SYMLINK:${crypto.createHash("sha256").update(fs.readlinkSync(absolutePath)).digest("hex")}`;
  }
  if (!stat.isFile()) return `OTHER:${stat.mode}:${stat.size}`;
  return `FILE:${crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex")}`;
}

function capture(repositoryRoot) {
  return Object.fromEntries(
    collectWorkingPaths(repositoryRoot).map((filePath) => [filePath, fingerprint(repositoryRoot, filePath)]),
  );
}

function isWithin(filePath, rootPath) {
  return filePath === rootPath || filePath.startsWith(`${rootPath}/`);
}

function isSensitive(filePath) {
  const baseName = path.posix.basename(filePath).toLowerCase();
  return SENSITIVE_NAMES.has(baseName) || SENSITIVE_EXTENSIONS.has(path.posix.extname(baseName));
}

function validateTestRoot(repositoryRoot, testRoot) {
  const absoluteRoot = path.join(repositoryRoot, ...testRoot.split("/"));
  if (!fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {
    fail(`Test root không tồn tại hoặc không phải thư mục: ${testRoot}`);
  }

  const projectFiles = fs
    .readdirSync(absoluteRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && [".csproj", ".fsproj", ".vbproj"].includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(absoluteRoot, entry.name));
  const hasTestMarker = projectFiles.some((projectFile) => {
    const content = fs.readFileSync(projectFile, "utf8");
    return /<IsTestProject>\s*true\s*<\/IsTestProject>/i.test(content) ||
      /Microsoft\.NET\.Test\.Sdk|xunit|NUnit|MSTest/i.test(content);
  });
  if (!hasTestMarker) {
    fail(`Test root không chứa project file có test marker đáng tin cậy: ${testRoot}`);
  }
}

function defaultStatePath() {
  return path.join(os.tmpdir(), `unit-test-write-boundary-${process.pid}-${Date.now()}.json`);
}

function snapshot(arguments_) {
  if (arguments_.testRoots.length === 0) fail("snapshot cần ít nhất một --test-root.");
  const repositoryRoot = findRepositoryRoot();
  const statePath = path.resolve(arguments_.statePath ?? defaultStatePath());
  const relativeState = path.relative(repositoryRoot, statePath);
  if (relativeState && relativeState !== ".." && !relativeState.startsWith(`..${path.sep}`)) {
    fail("State file phải nằm ngoài repository để không trở thành một thay đổi trong working tree.");
  }

  const testRoots = arguments_.testRoots.map((item) =>
    normalizeRepositoryPath(repositoryRoot, item, "Test root"),
  );
  for (const testRoot of testRoots) validateTestRoot(repositoryRoot, testRoot);

  const allowedConfig = arguments_.allowedConfig.map((item) =>
    normalizeRepositoryPath(repositoryRoot, item, "Allowed config"),
  );
  for (const configPath of allowedConfig) {
    if (!isSensitive(configPath)) {
      fail(`--allow-config chỉ chấp nhận project/solution/build config, không chấp nhận: ${configPath}`);
    }
  }

  const state = {
    version: VERSION,
    repositoryRoot,
    testRoots,
    allowedConfig,
    head: currentHead(repositoryRoot),
    baseline: capture(repositoryRoot),
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  console.log("WRITE_BOUNDARY_SNAPSHOT_OK");
  console.log(`State: ${statePath}`);
  console.log(`Allowed test roots: ${state.testRoots.join(", ")}`);
  console.log(`Approved config: ${state.allowedConfig.join(", ") || "(không có)"}`);
}

function check(arguments_) {
  if (!arguments_.statePath) fail("check cần --state trỏ tới snapshot đã tạo.");
  const statePath = path.resolve(arguments_.statePath);
  if (!fs.existsSync(statePath)) fail(`Không tìm thấy state file: ${statePath}`);

  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (state.version !== VERSION) fail(`Phiên bản state không hỗ trợ: ${state.version}`);
  const currentRepositoryRoot = findRepositoryRoot();
  if (path.resolve(state.repositoryRoot) !== currentRepositoryRoot) {
    fail("Snapshot thuộc repository khác với working directory hiện tại.");
  }

  const head = currentHead(currentRepositoryRoot);
  if (state.head !== head) {
    console.error("WRITE_BOUNDARY_VIOLATION");
    console.error(`- Git HEAD đã thay đổi: ${state.head} -> ${head}`);
    console.error("Yêu cầu sinh test không cấp quyền commit. Không tự động reset hoặc revert.");
    process.exit(1);
  }

  const current = capture(currentRepositoryRoot);
  const allPaths = new Set([...Object.keys(state.baseline), ...Object.keys(current)]);
  const changedSinceSnapshot = [...allPaths]
    .filter((filePath) => state.baseline[filePath] !== current[filePath])
    .sort();

  const violations = changedSinceSnapshot.filter((filePath) => {
    if (state.allowedConfig.includes(filePath)) return false;
    const inTestRoot = state.testRoots.some((testRoot) => isWithin(filePath, testRoot));
    if (!inTestRoot) return true;
    return isSensitive(filePath);
  });

  if (violations.length > 0) {
    console.error("WRITE_BOUNDARY_VIOLATION");
    for (const filePath of violations) console.error(`- ${filePath}`);
    console.error("Không tự động revert. Hãy báo các đường dẫn trên và chờ chỉ dẫn của người dùng.");
    process.exit(1);
  }

  console.log("WRITE_BOUNDARY_OK");
  console.log(`Changed inside allowed scope: ${changedSinceSnapshot.join(", ") || "(không có)"}`);
}

const arguments_ = parseArguments(process.argv.slice(2));
if (arguments_.mode === "snapshot") snapshot(arguments_);
else if (arguments_.mode === "check") check(arguments_);
else fail("Cách dùng: production-write-boundary.mjs <snapshot|check> [options]");
