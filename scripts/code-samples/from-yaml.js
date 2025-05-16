import { argv } from "node:process";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  generatedCodeSamplesDir,
  iterateCodeSamples,
  delimiter,
} from "./shared.js";

const headerImport = 'import { MeiliSearch } from "meilisearch";\n';
const headerClientDeclaration =
  'const _client = new MeiliSearch({ host: "http://127.0.0.1:7700" });\n';
const headerComment =
  "// Code below this line will be written to code samples YAML file\n" +
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

for (const jsonFileToGenerate of jsonFilesToGenerate) {
  writeFileSync(
    new URL(jsonFileToGenerate + ".json", generatedCodeSamplesDir),
    "[]",
  );
}

for (const { sampleName, code } of iterateCodeSamples()) {
  let header = "";

  if (!code.includes('from "meilisearch";\n')) {
    header += headerImport;
  }

  if (!code.includes("new MeiliSearch(")) {
    header += headerClientDeclaration;
  }

  header += headerComment;

  writeFileSync(
    new URL(sampleName + ".ts", generatedCodeSamplesDir),
    header + code + "\n",
  );
}

for (const sampleName of argv.slice(3)) {
  writeFileSync(
    new URL(sampleName + ".ts", generatedCodeSamplesDir),
    headerImport + headerClientDeclaration + headerComment,
  );
}
