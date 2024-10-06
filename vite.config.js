import { defineConfig } from "vite";

const indexInput = "src/index.ts";
const tokenInput = "src/token.ts";

export default defineConfig(({ mode }) => {
  const isUMDBuild = mode === "production";

  return {
    build: {
      // for CJS build we do not want to empty directory, so previous builds stay intact
      emptyOutDir: isUMDBuild,
      // it only makes sense to minify the UMD build
      minify: isUMDBuild,
      // there's no point in generating source maps for UMD bundle @TODO: Is this true?
      sourcemap: !isUMDBuild,
      // UMD build targets lower level ES, while CJS the lowest Node.js LTS version
      target: isUMDBuild ? "es6" : "es2022",
      lib: {
        // leave out token from UMD build
        entry: isUMDBuild ? indexInput : [indexInput, tokenInput],
        name: isUMDBuild ? "meilisearch" : undefined,
        formats: isUMDBuild ? ["umd"] : ["cjs"],
        fileName: (format, entryName) => {
          switch (format) {
            case "umd":
              return `bundles/${entryName}.umd.min.js`;
            case "cjs":
              return `bundles/${entryName}.cjs`;
            default:
              throw new Error(`unsupported format ${format}`);
          }
        },
      },
      rollupOptions: isUMDBuild
        ? undefined
        : {
            // make sure external imports that should not be bundled are listed here for CJS build
            external: ["node:crypto"],
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
