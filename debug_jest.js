import { spawn } from "child_process";
import { writeFile } from "fs/promises";

const run = async () => {
  const child = spawn("node", [
    "--experimental-vm-modules",
    "node_modules/jest/bin/jest.js",
    "tests/unit/controllers/businessValidations.test.js",
    "--no-colors",
    "--verbose",
  ]);

  let output = "";
  child.stdout.on("data", (data) => (output += data.toString()));
  child.stderr.on("data", (data) => (output += data.toString()));

  child.on("close", async (code) => {
    await writeFile("jest_debug.txt", output);
    process.exit(code);
  });
};
run();
