import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repositoryRoot = process.cwd();
const boundaryScript = path.join(
  repositoryRoot,
  "skills",
  "generate-tests",
  "scripts",
  "production-write-boundary.mjs",
);
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "write-boundary-test-"));
const statePath = path.join(os.tmpdir(), `write-boundary-state-${process.pid}.json`);

function run(command, args, expectedStatus = 0) {
  const result = spawnSync(command, args, {
    cwd: fixtureRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== expectedStatus) {
    throw new Error(
      `Expected ${command} ${args.join(" ")} to exit ${expectedStatus}, got ${result.status}.\n` +
        `${result.stdout}\n${result.stderr}`,
    );
  }
  return `${result.stdout}${result.stderr}`;
}

function write(relativePath, content) {
  const absolutePath = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

function snapshot(extraArguments = []) {
  return run(process.execPath, [
    boundaryScript,
    "snapshot",
    "--test-root",
    "tests/App.Tests",
    "--state",
    statePath,
    ...extraArguments,
  ]);
}

function check(expectedStatus = 0) {
  return run(process.execPath, [boundaryScript, "check", "--state", statePath], expectedStatus);
}

try {
  run("git", ["init"]);
  run("git", ["config", "user.email", "write-boundary@example.invalid"]);
  run("git", ["config", "user.name", "Write Boundary Test"]);
  write("src/Service.cs", "public sealed class Service {}\n");
  write("src/appsettings.Local.json", "{\"ApiKey\":\"before\"}\n");
  write(".gitignore", "src/appsettings.Local.json\n**/obj/\n");
  write("tests/App.Tests/ServiceTests.cs", "public sealed class ServiceTests {}\n");
  write(
    "tests/App.Tests/App.Tests.csproj",
    "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><IsTestProject>true</IsTestProject></PropertyGroup></Project>\n",
  );
  run("git", ["add", "."]);
  run("git", ["commit", "-m", "fixture"]);

  const invalidRoot = run(
    process.execPath,
    [boundaryScript, "snapshot", "--test-root", "src", "--state", statePath],
    2,
  );
  if (!invalidRoot.includes("test marker")) {
    throw new Error(`A production project must not be accepted as a test root.\n${invalidRoot}`);
  }

  const invalidConfig = run(
    process.execPath,
    [
      boundaryScript,
      "snapshot",
      "--test-root",
      "tests/App.Tests",
      "--allow-config",
      "src/Service.cs",
      "--state",
      statePath,
    ],
    2,
  );
  if (!invalidConfig.includes("chỉ chấp nhận project/solution/build config")) {
    throw new Error(`--allow-config must not authorize a production source file.\n${invalidConfig}`);
  }

  snapshot();
  write("tests/App.Tests/ServiceTests.cs", "public sealed class ServiceTests { /* test */ }\n");
  if (!check().includes("WRITE_BOUNDARY_OK")) throw new Error("Test source change should pass.");

  write("src/Service.cs", "public sealed class Service { public int Value => 1; }\n");
  const productionViolation = check(1);
  if (!productionViolation.includes("src/Service.cs")) {
    throw new Error("Production violation did not report the exact path.");
  }

  run("git", ["checkout", "--", "src/Service.cs", "tests/App.Tests/ServiceTests.cs"]);
  snapshot();
  write("tests/App.Tests/App.Tests.csproj", "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup /></Project>\n");
  const configViolation = check(1);
  if (!configViolation.includes("tests/App.Tests/App.Tests.csproj")) {
    throw new Error("Unapproved test project change should fail.");
  }

  run("git", ["checkout", "--", "tests/App.Tests/App.Tests.csproj"]);
  snapshot(["--allow-config", "tests/App.Tests/App.Tests.csproj"]);
  write("tests/App.Tests/App.Tests.csproj", "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup /></Project>\n");
  if (!check().includes("WRITE_BOUNDARY_OK")) {
    throw new Error("Explicitly approved test project change should pass.");
  }

  run("git", ["checkout", "--", "tests/App.Tests/App.Tests.csproj"]);
  snapshot();
  write("src/appsettings.Local.json", "{\"ApiKey\":\"after\"}\n");
  const ignoredProductionViolation = check(1);
  if (!ignoredProductionViolation.includes("src/appsettings.Local.json")) {
    throw new Error("An ignored production config change must not bypass the boundary.");
  }

  write("src/appsettings.Local.json", "{\"ApiKey\":\"before\"}\n");
  snapshot();
  write("src/obj/project.assets.json", "{\"generated\":true}\n");
  if (!check().includes("WRITE_BOUNDARY_OK")) {
    throw new Error("Ignored build output must not create a boundary violation.");
  }

  snapshot();
  write("src/Service.cs", "public sealed class Service { public int Committed => 1; }\n");
  run("git", ["add", "src/Service.cs"]);
  run("git", ["commit", "-m", "unauthorized production change"]);
  const committedViolation = check(1);
  if (!committedViolation.includes("Git HEAD đã thay đổi")) {
    throw new Error("Committing a production change must not bypass the boundary.");
  }

  console.log("Production write-boundary tests passed.");
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
  fs.rmSync(statePath, { force: true });
}
