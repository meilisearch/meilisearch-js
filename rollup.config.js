const nodeResolve = require("@rollup/plugin-node-resolve");
const { resolve } = require("node:path");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const typescript = require("rollup-plugin-typescript2");
const pkg = require("./package.json");
const terser = require("@rollup/plugin-terser");
const { babel } = require("@rollup/plugin-babel");

function getOutputFileName(fileName, isProd = false) {
  return isProd ? fileName.replace(/\.js$/, ".min.js") : fileName;
}

const env = process.env.NODE_ENV || "development";
const ROOT = resolve(__dirname, ".");

const PLUGINS = [
  typescript({
    useTsconfigDeclarationDir: true,
    tsconfigOverride: {
      compilerOptions: { allowJs: false },
      include: ["src"],
      exclude: ["tests", "examples", "*.js", "scripts"],
    },
  }),
];

module.exports = [
  // browser-friendly UMD build
  {
    input: "src/browser.ts", // directory to transpilation of typescript
    output: {
      name: "window",
      extend: true,
      file: getOutputFileName(
        // will add .min. in filename if in production env
        resolve(ROOT, pkg.jsdelivr),
        env === "production",
      ),
      format: "umd",
      sourcemap: env === "production", // create sourcemap for error reporting in production mode
    },
    plugins: [
      ...PLUGINS,
      babel({
        babelrc: false,
        extensions: [".ts"],
        presets: [
          [
            "@babel/preset-env",
            {
              modules: false,
              targets: {
                browsers: ["last 2 versions", "ie >= 11"],
              },
            },
          ],
        ],
      }),
      nodeResolve({
        mainFields: ["jsnext", "main"],
        preferBuiltins: true,
        browser: true,
      }),
      commonjs({
        include: ["node_modules/**"],
      }),
      // nodePolyfills
      json(),
      env === "production" ? terser() : {}, // will minify the file in production mode
    ],
  },

  // ES module (for bundlers) build.
  {
    input: "src/index.ts",
    output: [
      {
        file: getOutputFileName(
          resolve(ROOT, pkg.module),
          env === "production",
        ),
        exports: "named",
        format: "es",
        sourcemap: env === "production", // create sourcemap for error reporting in production mode
      },
    ],
    plugins: PLUGINS,
  },
  // Common JS build (Node).
  // Compatible only in a nodeJS environment.
  {
    input: "src/index.ts",
    output: {
      file: getOutputFileName(
        // will add .min. in filename if in production env
        resolve(ROOT, pkg.main),
        env === "production",
      ),
      exports: "named",
      format: "cjs",
      sourcemap: env === "production", // create sourcemap for error reporting in production mode
    },
    plugins: PLUGINS,
  },
];
