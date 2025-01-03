import { defineConfig } from "vite";

const indexInput = "src/index.ts";
const tokenInput = "src/token.ts";

export default defineConfig(({ mode }) => {
  const isCJSBuild = mode === "production";
  const globalVarName = "meilisearch";

  return {
    build: {
      // for UMD build we do not want to empty directory, so previous builds stay intact
      emptyOutDir: isCJSBuild,
      minify: true,
      sourcemap: true,
      // UMD build targets lower level ES, while CJS the lowest Node.js LTS version
      target: isCJSBuild ? "es2022" : "es6",
      lib: {
        // leave out token from UMD build
        entry: isCJSBuild ? [indexInput, tokenInput] : indexInput,
        name: isCJSBuild ? undefined : globalVarName,
        formats: isCJSBuild ? ["cjs"] : ["umd"],
        fileName: (format, entryName) => {
          switch (format) {
            case "umd":
              return `umd/${entryName}.min.js`;
            case "cjs":
              return `cjs/${entryName}.cjs`;
            default:
              throw new Error(`unsupported format ${format}`);
          }
        },
      },
      rollupOptions: isCJSBuild
        ? {
            // make sure external imports that should not be bundled are listed here for CJS build
            external: ["node:crypto"],
          }
        : // https://github.com/vitejs/vite/issues/11624
          {
            output: {
              footer: `(function(d,_){(d=typeof globalThis!="undefined"?globalThis:d||self,_(d))})(this,function(d){for(var k of Object.keys(d.${globalVarName})){d[k]=d.${globalVarName}[k]}})`,
            },
          },
    },
    test: {
      include: "tests/**/*.test.ts",
      exclude: "tests/env/**",
      fileParallelism: false,
      testTimeout: 100_000, // 100 seconds
      coverage: { include: "src/**/*.ts" },
    },
  };
});
