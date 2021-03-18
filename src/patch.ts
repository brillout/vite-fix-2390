import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const PATCH_FILE = "dist/node/chunks/dep-efe32886.js";
const PATCH_LINE = 23655;
const VITE_VERSION = "2.1.2";
const PATCH_CONDITION = "importer.includes('node_modules')";
const PATCH_NEW_CONDITION = "!source.includes('import.meta.glob')";

export { patchIsInstalled };
export { patchViteIssue2390 };

function patchIsInstalled() {
  const { source } = getTarget();
  return alreadyPatched(source);
}
function alreadyPatched(source: string) {
  // Already patched
  return source.includes(PATCH_NEW_CONDITION);
}

function getTarget() {
  const vitePackageJson = require.resolve("vite/package.json");
  const viteRoot = dirname(vitePackageJson);

  const { version } = require(vitePackageJson);
  if (version !== VITE_VERSION) {
    throw new Error(
      `Only the Vite version ${VITE_VERSION} is supported. Your vite version: ${version}`
    );
  }

  let targetFile;
  try {
    targetFile = require.resolve(join(viteRoot, PATCH_FILE));
  } catch (err) {
    throw patchError();
  }

  const source = readFileSync(targetFile, "utf8");

  return { targetFile, source };
}

function patchViteIssue2390({ log }: { log: boolean }) {
  const { source, targetFile } = getTarget();

  if (alreadyPatched(source)) {
    if (log) console.log("Vite already patched.");
    return;
  }

  applyPatch(source, targetFile, log);
}

function applyPatch(source: string, targetFile: string, log: boolean) {
  const lines = source.split(/\r?\n/);
  let line = lines[PATCH_LINE - 1];
  if (!line.includes(PATCH_CONDITION)) {
    throw patchError();
  }
  const parts = line.split(PATCH_CONDITION);
  if (parts.length !== 2) {
    throw patchError();
  }
  const linePatched =
    parts[0] + `(${PATCH_CONDITION} && ${PATCH_NEW_CONDITION})` + parts[1];
  lines[PATCH_LINE - 1] = linePatched;
  const sourcePatched = lines.join("\n");

  writeFileSync(targetFile, sourcePatched, "utf8");

  if (log) console.log("Vite successfully patched.");
}

function patchError() {
  return new Error(
    "Could not patch vite. Contact @brillout on Discord or by opening a new GitHub issue."
  );
}
