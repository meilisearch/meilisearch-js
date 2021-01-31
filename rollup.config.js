import nodeResolve from '@rollup/plugin-node-resolve'
import { resolve } from 'path'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
import { terser } from 'rollup-plugin-terser'
import { babel } from '@rollup/plugin-babel'

function getOutputFileName(fileName, isProd = false) {
  return isProd ? fileName.replace(/\.js$/, '.min.js') : fileName
}

const env = process.env.NODE_ENV || 'development'
const ROOT = resolve(__dirname, '.')

const PLUGINS = [
  typescript({
    useTsconfigDeclarationDir: true,
    tsconfigOverride: {
      allowJs: false,
      include: ['src'],
      exclude: ['tests', 'examples', '*.js', 'scripts'],
    },
  }),
]

module.exports = [
  // browser-friendly UMD build
  {
    input: 'src/meilisearch.ts', // directory to transpilation of typescript
    external: ['cross-fetch', 'cross-fetch/polyfill'],
    output: {
      name: 'window',
      extend: true,
      file: getOutputFileName(
        // will add .min. in filename if in production env
        resolve(ROOT, pkg.browser),
        env === 'production'
      ),
      format: 'umd',
      sourcemap: env === 'production', // create sourcemap for error reporting in production mode
    },
    plugins: [
      ...PLUGINS,
      babel({
        babelrc: false,
        extensions: ['.ts'],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                browsers: ['last 2 versions', 'ie >= 11'],
              },
            },
          ],
        ],
      }),
      nodeResolve({
        mainFields: ['jsnext', 'main'],
        preferBuiltins: true,
        browser: true,
      }),
      commonjs({
        include: ['node_modules/**'],
      }),
      // nodePolyfills
      json(),
      env === 'production' ? terser() : {}, // will minify the file in production mode
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/meilisearch.ts',
    external: ['cross-fetch', 'cross-fetch/polyfill'],
    output: [
      {
        file: getOutputFileName(
          resolve(ROOT, pkg.module),
          env === 'production'
        ),
        exports: 'named',
        format: 'es',
        sourcemap: env === 'production', // create sourcemap for error reporting in production mode
      },
    ],
    plugins: [
      env === 'production' ? terser() : {}, // will minify the file in production mode
      ...PLUGINS,
    ],
  },
]
