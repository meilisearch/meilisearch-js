import { argv } from "node:process";

if (argv[2] === "to-yaml" && argv.length === 3) {
  await import("./code-samples/to-yaml.js");
} else if (argv[2] === "from-yaml") {
  await import("./code-samples/from-yaml.js");
} else {
  throw new Error(
    "expected `to-yaml` (+ new code samples names) or `from-yaml` as arguments",
  );
}
