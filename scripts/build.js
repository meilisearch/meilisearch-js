/** This file only purpose is to execute any build related tasks */

import { resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import pkg from "../package.json" with { type: "json" };

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TYPES_ROOT_FILE = resolve(ROOT, normalize(pkg.exports["."].types));

main();

function main() {
  writeDtsHeader();
}

function writeDtsHeader() {
  const dtsHeader = getDtsHeader(
    pkg.name,
    pkg.version,
    pkg.author,
    pkg.repository.url,
    pkg.devDependencies.typescript,
  );

  prependFileSync(TYPES_ROOT_FILE, dtsHeader);
}

/**
 * @param {string} pkgName
 * @param {string} version
 * @param {string} author
 * @param {string} repoUrl
 * @param {string} tsVersion
 */
function getDtsHeader(pkgName, version, author, repoUrl, tsVersion) {
  const extractUserName = repoUrl.match(/\.com\/([\w-]+)\/\w+/i);
  const githubUserUrl = extractUserName ? extractUserName[1] : "Unknown";

  return `
// Type definitions for ${pkgName} ${version}
// Project: ${repoUrl}
// Definitions by: ${author} <https://github.com/${githubUserUrl}>
// Definitions: ${repoUrl}
// TypeScript Version: ${tsVersion}
`.replace(/^\s+/gm, "");
}

/**
 * @param {string} path
 * @param {string | Blob} data
 */
function prependFileSync(path, data) {
  const existingFileContent = readFileSync(path, {
    encoding: "utf8",
  });
  const newFileContent = [data, existingFileContent].join("\n");
  writeFileSync(path, newFileContent, {
    flag: "w+",
    encoding: "utf8",
  });
}
