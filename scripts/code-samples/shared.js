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
  const codeSamplesContents = readFileSync(codeSamplesPath);

  const codeSamples = load(codeSamplesContents, {
    filename: codeSamplesPath.href,
    onWarning: console.warn,
  });

  if (codeSamples === null || typeof codeSamples !== "object") {
    throw new Error("expected `codeSamples` to be an object", {
      cause: codeSamples,
    });
  }

  for (const [sampleName, code] of Object.entries(codeSamples)) {
    if (typeof code !== "string") {
      throw new Error("expected `code` to be a string", { cause: code });
    }

    yield { sampleName, code };
  }
}
