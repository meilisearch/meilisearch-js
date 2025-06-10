import { argv } from "node:process";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  generatedCodeSamplesDir,
  iterateCodeSamples,
  delimiter,
} from "./shared.js";

const headerImport = 'import { MeiliSearch } from "meilisearch";\n';
const headerClientDeclaration =
  'const client = new MeiliSearch({ host: "http://127.0.0.1:7700" });\n';
const headerComment =
  "// Code below this line will be written to code samples YAML file\n" +
  '// For more information consult CONTRIBUTING.md "Tests and Linter" section\n' +
  delimiter +
  "\n";

const jsonFilesToGenerate = ["games", "movies", "meteorites"];

try {
  mkdirSync(generatedCodeSamplesDir);
} catch (error) {
  if (error.code !== "EEXIST") {
    throw error;
  }
}

// generate JSON files used by samples, so type check passes
for (const jsonFileToGenerate of jsonFilesToGenerate) {
  writeFileSync(
    new URL(jsonFileToGenerate + ".json", generatedCodeSamplesDir),
    "[]\n",
  );
}

const clientVarRegExp = /(?<=const|let ).+(?= = new MeiliSearch\()/;

let generatedFileTally = 0;

for (const { sampleName, code } of iterateCodeSamples()) {
  let header = "";

  const clientVarMatch = code.match(clientVarRegExp);
  const clientVarLiteral = clientVarMatch?.[0] ?? "client";
  const clientVarUsageRegExp = new RegExp(`${clientVarLiteral}\\s*\\.`);

  // if there is client usage in the code sample
  if (clientVarUsageRegExp.test(code)) {
    // generate import if there isn't already one
    if (!code.includes('from "meilisearch";\n')) {
      header += headerImport;
    }

    // generate client declaration if there isn't already one
    if (clientVarMatch === null) {
      header += headerClientDeclaration;
    }
  }

  header += headerComment;

  writeFileSync(
    new URL(sampleName + ".ts", generatedCodeSamplesDir),
    header + code + "\n",
  );

  generatedFileTally += 1;
}

// generate additional files from arguments passed
for (const sampleName of argv.slice(3)) {
  writeFileSync(
    new URL(sampleName + ".ts", generatedCodeSamplesDir),
    headerImport + headerClientDeclaration + headerComment,
  );

  generatedFileTally += 1;
}

console.log(`generated ${generatedFileTally} code sample file(s)`);
