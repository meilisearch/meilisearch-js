import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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

const dirEntries = readdirSync(generatedCodeSamplesDir, {
  withFileTypes: true,
});

function throwError() {
  throw new Error(
    `expected generated code samples directory at ${generatedCodeSamplesDir.href} to only contain TypeScript and JSON files`,
    { cause: dirEntries },
  );
}

const serializedCodeSamples = dirEntries
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
      .map((v) => "  " + v)
      .join("\n")
      .trimEnd();

    return { name, indentedContent };
  })
  .filter((v) => v !== null)
  .sort(({ name: nameA }, { name: nameB }) => {
    const indexOfA = codeSampleNamesFromYaml.indexOf(nameA);
    return indexOfA === -1
      ? 1
      : indexOfA - codeSampleNamesFromYaml.indexOf(nameB);
  })
  .map(({ name, indentedContent }) => name + ": |-\n" + indentedContent)
  .join("\n");

const header =
  "# This code-samples file is used by the Meilisearch documentation\n" +
  "# Every example written here will be automatically fetched by\n" +
  "# the documentation on build\n" +
  "# You can read more at https://github.com/meilisearch/documentation\n" +
  "---\n";

writeFileSync(codeSamplesPath, header + serializedCodeSamples + "\n");
