import { spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";

const project = "evals/generated-tests/App.Tests/App.Tests.csproj";
const assets = "evals/generated-tests/App.Tests/obj/project.assets.json";
const mutantProject = "evals/generated-tests/App.Mutant/App.Mutant.csproj";
const mutantAssets = "evals/generated-tests/App.Mutant/obj/project.assets.json";

function run(args, expectedStatus) {
  const result = spawnSync("dotnet", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== expectedStatus) {
    throw new Error(
      `Expected dotnet ${args.join(" ")} to exit ${expectedStatus}, got ${result.status}.\n` +
      `${result.stdout}\n${result.stderr}`,
    );
  }
  return `${result.stdout}${result.stderr}`;
}

if (!fs.existsSync(assets)) run(["restore", project, "--nologo"], 0);
if (!fs.existsSync(mutantAssets)) run(["restore", mutantProject, "--nologo"], 0);
run(["test", project, "--nologo", "--verbosity", "minimal", "--no-restore"], 0);
const mutantOutput = run([
  "test",
  project,
  "--nologo",
  "--verbosity",
  "minimal",
  "--no-restore",
  "-p:UseMutant=true",
], 1);
if (!mutantOutput.includes("Apply_AtThreshold_AppliesTenPercentDiscount")) {
  throw new Error("Generated tests did not report the seeded boundary mutant.");
}

console.log("Generated-test fixture passed and killed the seeded mutant.");
