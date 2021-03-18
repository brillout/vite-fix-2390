import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import assert = require("assert");

const PATCH_FILE = "dist/node/chunks/dep-efe32886.js";
const PATCH_LINE = 23655;
const VITE_VERSION = "2.1.2";
const PATCH_CONDITION = "importer.includes('node_modules')";
const PATCH_NEW_CONDITION = "!source.includes('import.meta.glob')";

export { assertPatch };
export { cli };
export { postinstall };

const projectName = "github.com:brillout/vite-fix-2390";
const versionMismatchError = (installedVersion: string) =>
  `[${projectName}][Warning] Couldn't apply patch. Only the Vite version \`${VITE_VERSION}\` is supported. Your vite version: \`${installedVersion}\`. Install \`vite@${VITE_VERSION}\` instead.`;

function assertPatch() {
  const versionMismatch = isVersionMismatch();
  if (versionMismatch) {
    throw new Error(versionMismatchError(versionMismatch));
  }
  if (!isAlreadyPatched()) {
    throw new Error(
      `[${projectName}][Error] Patch not applied. Make sure to call \`npx vite-fix-2390\` (or \`yarn vite-fix-2390\`) before building your Vite app.`
    );
  }
}

function cli() {
  const versionMismatch = isVersionMismatch();
  if (versionMismatch) {
    throw new Error(versionMismatchError(versionMismatch));
  }
  if (isAlreadyPatched()) {
    console.log("Vite already patched.");
    return;
  }
  applyPatch();
  console.log("Vite successfully patched.");
}

function postinstall() {
  const versionMismatch = isVersionMismatch();
  if (versionMismatch) {
    console.warn(versionMismatchError(versionMismatch));
    return;
  }
  applyPatch();
}

function isVersionMismatch(): false | string {
  const { version } = getViteInfo();
  if (version !== VITE_VERSION) {
    assert(version);
    return version;
  }
  return false;
}

function isAlreadyPatched() {
  const { sourceCode } = getPatchTarget();
  return sourceCode.includes(PATCH_NEW_CONDITION);
}

function getViteInfo() {
  const vitePackageJson = require.resolve("vite/package.json");
  const viteRoot = dirname(vitePackageJson);
  const { version } = require(vitePackageJson);
  return { version, viteRoot };
}

function getPatchTarget(): { sourceCode: string; targetFile: string } {
  const { viteRoot } = getViteInfo();

  let targetFile;
  try {
    targetFile = require.resolve(join(viteRoot, PATCH_FILE));
  } catch (err) {
    throw patchError();
  }

  const sourceCode = readFileSync(targetFile, "utf8");

  return { targetFile, sourceCode };
}

function applyPatch() {
  const { sourceCode, targetFile } = getPatchTarget();

  const lines = sourceCode.split(/\r?\n/);
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
}

function patchError() {
  return new Error(
    `[${projectName}][Internal Error] Could not patch vite. Contact @brillout on Discord or by opening a new GitHub issue.`
  );
}
