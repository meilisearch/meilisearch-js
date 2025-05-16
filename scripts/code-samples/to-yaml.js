import { readdir } from "node:fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node:path";
import {
  codeSamplesPath,
  generatedCodeSamplesDir,
  iterateCodeSamples,
  delimiter,
} from "./shared.js";

const codeSampleNamesFromYaml = Array.from(
  iterateCodeSamples(),
  (v) => v.sampleName,
);

/** @type {import("node:fs").Dirent[]} */
const dirEntries = await readdir(generatedCodeSamplesDir, {
  withFileTypes: true,
}).catch((error) => {
  if (error?.code !== "ENOENT") {
    throw error;
  }

  return [];
});

if (dirEntries.length === 0) {
  throw new Error(
    `there are no code sample files at ${generatedCodeSamplesDir.href}\n` +
      "tip: first generate them from the YAML file, consult CONTRIBUTING.md on how to use this script",
  );
}

function throwError() {
  throw new Error(
    `expected generated code samples directory at ${generatedCodeSamplesDir.href} to only contain TypeScript and JSON files`,
    { cause: dirEntries },
  );
}

const manipulatedCodeSamples = dirEntries
  .map((dirEnt) => {
    if (!dirEnt.isFile()) {
      throwError();
    }

    const { ext, name } = parse(dirEnt.name);
    if (ext !== ".ts" && ext !== ".json") {
      throwError();
    }

    if (ext === ".json") {
      return null;
    }

    const codeSampleContent = readFileSync(dirEnt.parentPath + dirEnt.name, {
      encoding: "utf-8",
    });

    const splitContent = codeSampleContent.split("\n");
    const indexOfDelimiter = splitContent.findIndex((v) => v === delimiter);

    const indentedContent = splitContent
      .slice(indexOfDelimiter === -1 ? 0 : indexOfDelimiter + 1)
      .map((v) => (v === "" ? v : "  " + v))
      .join("\n")
      .trimEnd();

    const index = codeSampleNamesFromYaml.indexOf(name);

    return { name, indentedContent, index };
  })
  .filter((v) => v !== null)
  .sort(({ index: indexA }, { index: indexB }) => indexA - indexB);

while (manipulatedCodeSamples.at(0)?.index === -1) {
  manipulatedCodeSamples.push(manipulatedCodeSamples.shift());
}

const serializedCodeSamples = manipulatedCodeSamples
  .map(({ name, indentedContent }) => name + ": |-\n" + indentedContent)
  .join("\n");

const header =
  "# This code-samples file is used by the Meilisearch documentation\n" +
  "# Every example written here will be automatically fetched by\n" +
  "# the documentation on build\n" +
  "# You can read more at https://github.com/meilisearch/documentation\n" +
  "---\n";

writeFileSync(codeSamplesPath, header + serializedCodeSamples + "\n");
