import { parseArgs } from "node:util";
import pkg from "../package.json" with { type: "json" };
import { fileURLToPath } from "node:url";
import { resolve, dirname, join, basename } from "node:path";
import { copyFile } from "node:fs/promises";

const {
  values: { to },
} = parseArgs({ options: { to: { type: "string" } } });

if (to === undefined) {
  throw new Error("required argument `to` missing");
}

const umdAbsolutePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  join("..", pkg.jsdelivr),
);

await copyFile(umdAbsolutePath, join(to, basename(pkg.jsdelivr)));
