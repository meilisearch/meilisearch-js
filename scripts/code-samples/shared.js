import { readFileSync } from "node:fs";
import { load } from "js-yaml";

export const codeSamplesPath = new URL(
  "../../.code-samples.meilisearch.yaml",
  import.meta.url,
);

export const generatedCodeSamplesDir = new URL(
  "../../generated-code-samples/",
  import.meta.url,
);

export const delimiter = "// -~-~-~-~-";

export function* iterateCodeSamples() {
  let codeSamplesContents;
  try {
    codeSamplesContents = readFileSync(codeSamplesPath, {
      encoding: "utf-8",
    });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    return;
  }

  const codeSamples = load(codeSamplesContents, {
    filename: codeSamplesPath.href,
    onWarning: console.warn,
  });

  // YAML file is empty
  if (codeSamples === undefined) {
    return;
  }

  if (codeSamples === null || typeof codeSamples !== "object") {
    throw new Error(
      `expected YAML contents to be of type \`Record<string, string>\`; got ${String(codeSamples)}`,
      {
        cause: codeSamples,
      },
    );
  }

  for (const [sampleName, code] of Object.entries(codeSamples)) {
    if (typeof code !== "string") {
      throw new Error(
        `expected YAML contents to be of type \`Record<string, string>\`; at ${sampleName} got ${String(code)}`,
        { cause: code },
      );
    }

    yield { sampleName, code };
  }
}
