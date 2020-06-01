import nodeResolve from '@rollup/plugin-node-resolve'
import { resolve } from 'path'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
import { terser } from 'rollup-plugin-terser'

function pascalCase(myStr) {
  return toUpperCase(dashToCamelCase(myStr))
}

function normalizePackageName(rawPackageName) {
  const scopeEnd = rawPackageName.indexOf('/') + 1

  return rawPackageName.substring(scopeEnd)
}

function getOutputFileName(fileName, isProd = false) {
  return isProd ? fileName.replace(/\.js$/, '.min.js') : fileName
}

function toUpperCase(myStr) {
  return `${myStr.charAt(0).toUpperCase()}${myStr.substr(1)}`
}

function dashToCamelCase(myStr) {
  return myStr.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

const env = process.env.NODE_ENV || 'development'
const LIB_NAME = pascalCase(normalizePackageName(pkg.name))
const ROOT = resolve(__dirname, '.')

const PLUGINS = [
  typescript({
    useTsconfigDeclarationDir: true,
    tsconfigOverride: {
      exclude: ['tests'],
      esModuleInterop: true,
    },
  }),
]

module.exports = [
  // browser-friendly UMD build
  {
    input: 'src/meilisearch.ts', // directory to transpilation of typescript
    output: {
      name: LIB_NAME,
      file: getOutputFileName(
        // will add .min. in filename if in production env
        resolve(ROOT, pkg.browser),
        env === 'production'
      ),
      format: 'umd',
      sourcemap: env === 'production', // create sourcemap for error reporting in production mode
      globals: {
        axios: 'axios',
      },
    },
    plugins: [
      nodeResolve({ jsnext: true, preferBuiltins: true, browser: true }),
      commonjs(),
      json(),
      env === 'production' ? terser() : {}, // will minify the file in production mode
      ...PLUGINS,
    ],
    external: ['axios'],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/meilisearch.ts',
    external: ['axios'],
    output: [
      {
        file: getOutputFileName(
          // will add .min. in filename if in production env
          resolve(ROOT, pkg.main),
          env === 'production'
        ),
        format: 'cjs',
        sourcemap: env === 'production', // create sourcemap for error reporting in production mode
      },
      {
        file: getOutputFileName(
          resolve(ROOT, pkg.module),
          env === 'production'
        ),
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
