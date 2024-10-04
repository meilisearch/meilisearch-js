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

const INDEX_INPUT = "src/index.ts";
const TOKEN_INPUT = "src/token.ts";
const TOKEN_EXPORTS = pkg.exports["./token"];

module.exports = [
  // browser-friendly UMD build
  {
    input: INDEX_INPUT,
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

  // Index
  // ES module build.
  {
    input: INDEX_INPUT,
    output: [
      {
        file: pkg.module,
        exports: "named",
        format: "es",
        sourcemap: env === "production", // create sourcemap for error reporting in production mode
      },
    ],
    plugins: [
      env === "production" ? terser() : {}, // will minify the file in production mode
      ...PLUGINS,
    ],
  },
  // Common JS build (Node).
  // Compatible only in a nodeJS environment.
  {
    input: INDEX_INPUT,
    output: {
      file: pkg.main,
      exports: "named",
      format: "cjs",
    },
    plugins: [...PLUGINS],
  },

  // Token
  // ES module build.
  {
    input: TOKEN_INPUT,
    output: [
      {
        file: TOKEN_EXPORTS.import,
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
    input: TOKEN_INPUT,
    output: {
      file: TOKEN_EXPORTS.require,
      exports: "named",
      format: "cjs",
      sourcemap: env === "production", // create sourcemap for error reporting in production mode
    },
    plugins: PLUGINS,
  },
];
