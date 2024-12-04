const { parseArgs } = require("node:util");
const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const {
  values: { minor, major, exact },
} = parseArgs({
  options: {
    build: { type: "boolean", short: "b", default: false },
    minor: { type: "boolean", short: "m", default: false },
    major: { type: "boolean", short: "M", default: false },
    exact: { type: "string", short: "e" },
  },
});

const pkg = require("../package.json");
let [M, m, b] = (exact !== undefined ? exact : pkg.version)
  .split(".")
  .map(Number);

console.log("old version: ", pkg.version);

if (exact === undefined) {
  if (major) {
    M += 1;
  } else if (minor) {
    m += 1;
  } else {
    b += 1;
  }
}

const version = `${M}.${m}.${b}`;

console.log("new version: ", version);

pkg.version = version;
const packageJSONPath = resolve(__dirname, "../package.json");
writeFileSync(packageJSONPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("written to: ", packageJSONPath);

const packageVersionPath = resolve(__dirname, "../src/package-version.ts");
writeFileSync(
  packageVersionPath,
  `export const PACKAGE_VERSION = "${version}";\n`,
);
console.log("written to: ", packageVersionPath);
