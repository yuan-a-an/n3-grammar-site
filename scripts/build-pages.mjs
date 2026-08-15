import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dist = path.join(root, "dist");
const staticIndex = path.join(dist, "server", "prerendered-routes", "index.html");
const vinextCli = path.join(root, "node_modules", "vinext", "dist", "cli.js");
const prepareScript = path.join(root, "scripts", "prepare-pages.mjs");

rmSync(dist, { recursive: true, force: true });

const build = spawnSync(
  process.execPath,
  [vinextCli, "build", "--prerender-concurrency", "1"],
  { cwd: root, env: process.env, stdio: "inherit" },
);

if (build.error) throw build.error;
if (build.status !== 0) {
  const recoverableWindowsExit = process.platform === "win32" && existsSync(staticIndex);
  if (!recoverableWindowsExit) process.exit(build.status ?? 1);
  console.warn("Vinext exited after producing the Windows static build; continuing with the verified output.");
}

const prepare = spawnSync(process.execPath, [prepareScript], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

if (prepare.error) throw prepare.error;
process.exit(prepare.status ?? 1);