import { argv } from "node:process";

function throwInvalidArgs() {
  throw new Error("expected `to-yaml` or `from-yaml` as arguments");
}

if (argv.length !== 3) {
  throwInvalidArgs();
}

if (argv[2] === "to-yaml") {
  await import("./code-samples/to-yaml.js");
} else if (argv[2] === "from-yaml") {
  await import("./code-samples/from-yaml.js");
} else {
  throwInvalidArgs();
}
