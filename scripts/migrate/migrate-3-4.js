/**
 * Migrate Typescript-library-starter from 3. -> 4.
 */

const JSON5 = require('json5')
const kleur = require('kleur')
const sortObjectByKeyNameList = require('sort-object-keys')
const {
  writeFileSync,
  copyFileSync,
  readFileSync,
  existsSync,
  unlinkSync,
} = require('fs')
const { resolve, join } = require('path')
const starterPkg = require('../../package.json')
const args = process.argv.slice(2)
const pathToProject = args[0]
const { log } = console

if (!pathToProject) {
  usage('3', '4')

  throw new Error(
    'you need provide relative path to package that uses ts-lib-starter!'
  )
}

const ROOT = process.cwd()
const PACKAGE_ROOT = resolve(ROOT, pathToProject)

main()

function main() {
  if (!existsSync(PACKAGE_ROOT)) {
    throw new Error(`${PACKAGE_ROOT}, doesn't exists`)
  }

  log(kleur.italic('Migration initialized 👀...'))

  log(kleur.gray('path to Package:'), PACKAGE_ROOT)

  updatePackageJson()
  updateTsConfig()
  updateTsLintConfig()
  updateConfigDir()
  updateScriptsDir()
  updatePrettierIgnore()

  log(kleur.cyan('DONE ✅'))
}

/**
 *
 * @param {string} from
 * @param {string} to
 */
function usage(from, to) {
  log(`
  Usage:
  $ node scripts/migrate/migrate-${from}-${to} <relative-path-to-your-project>

  Your current working directory should be within typescript-lib-starter github project:
  "$ pwd 👉  ~/projects/typescript-lib-starter"

  Example:

  "$ node scripts/migrate/migrate-${from}-${to} ../my-projects/my-existing-package"
  `)
}

function updatePackageJson() {
  const libPackagePkgPath = resolve(PACKAGE_ROOT, 'package.json')

  /**
   * @type {typeof starterPkg}
   */
  const libPackagePkg = JSON.parse(
    readFileSync(libPackagePkgPath, { encoding: 'utf-8' })
  )

  /**
   * @type {typeof starterPkg}
   */
  const updatePkg = {
    ...libPackagePkg,
    main: starterPkg.main,
    engines: { ...libPackagePkg.engines, ...starterPkg.engines },
    scripts: { ...libPackagePkg.scripts, ...starterPkg.scripts },
    config: {
      ...starterPkg.config,
    },
    husky: {
      ...starterPkg.husky,
    },
    peerDependencies: sortObjectByKeyNameList({
      ...libPackagePkg.peerDependencies,
      ...starterPkg.peerDependencies,
    }),
    devDependencies: sortObjectByKeyNameList({
      ...starterPkg.devDependencies,
      ...libPackagePkg.devDependencies,
    }),
  }

  removePackages(updatePkg.devDependencies)
  writePackage(updatePkg)

  /**
   *
   * @param {{[packageName:string]:string}} devDependencies
   */
  function removePackages(devDependencies) {
    const depsToRemove = [
      '@types/uglifyjs-webpack-plugin',
      '@types/webpack',
      'uglifyjs-webpack-plugin',
      'webpack',
      'webpack-cli',
      'validate-commit-msg',
      'awesome-typescript-loader',
      // packages needed for this script
      'json5',
      '@types/json5',
      'sort-package-json',
      'sort-object-keys',
    ]

    depsToRemove.forEach(
      (dependencyName) => delete devDependencies[dependencyName]
    )
  }

  /**
   * @param {typeof starterPkg} pkg
   */
  function writePackage(pkg) {
    const updatedLibPkgToWrite = JSON.stringify(pkg, null, 2)
    writeFileSync(join(PACKAGE_ROOT, 'package.json'), updatedLibPkgToWrite)

    log(
      '\n updated package.json:',
      updatedLibPkgToWrite,
      '========================\n'
    )
  }
}

function updateTsConfig() {
  /**
   * @typedef {typeof import('../tsconfig.json')} TsConfig
   */

  const starterConfigPath = resolve(ROOT, 'tsconfig.json')
  const libPackageConfigPath = resolve(PACKAGE_ROOT, 'tsconfig.json')

  /**
   * @type {TsConfig}
   */
  const starterConfig = JSON5.parse(
    readFileSync(starterConfigPath, { encoding: 'utf-8' })
  )

  /**
   * @type {TsConfig}
   */
  const libConfig = JSON5.parse(
    readFileSync(libPackageConfigPath, { encoding: 'utf-8' })
  )

  const newConfig = {
    ...libConfig,
    compilerOptions: {
      ...libConfig.compilerOptions,
      ...starterConfig.compilerOptions,
    },
    include: [...new Set([...libConfig.include, ...starterConfig.include])],
  }

  const updatedLibTsConfigToWrite = JSON.stringify(newConfig, null, 2)
  writeFileSync(libPackageConfigPath, updatedLibTsConfigToWrite)

  log('==TS-Config:updated ☕️✅ ==\n')
}

function updateTsLintConfig() {
  /**
   * @typedef {typeof import('../../tslint.json')} TsLintConfig
   */

  const starterConfigPath = resolve(ROOT, 'tslint.json')
  const libPackageConfigPath = resolve(PACKAGE_ROOT, 'tslint.json')

  /**
   * @type {TsLintConfig}
   */
  const starterConfig = JSON5.parse(
    readFileSync(starterConfigPath, { encoding: 'utf-8' })
  )

  /**
   * @type {TsLintConfig}
   */
  const libConfig = JSON5.parse(
    readFileSync(libPackageConfigPath, { encoding: 'utf-8' })
  )

  // @TODO find out how to properly merge objects with comments as tslint.json supports comments
  // 👉 https://github.com/Hotell/typescript-lib-starter/issues/133

  // log('starter:', starterConfig)
  // log('library:', libConfig)

  log('==TS-Lint:nothing updated ☕️ ==\n')
}

function updateConfigDir() {
  const starterConfigPathDir = resolve(ROOT, 'config')
  const libPackageConfigPathDir = resolve(PACKAGE_ROOT, 'config')

  const filesToCopy = [
    'commitlint.config.js',
    'jest.config.js',
    'rollup.config.js',
    'helpers.js',
    'types.js',
    'global.d.ts',
    'tsconfig.json',
  ]
  const filesToRemove = ['webpack.config.js']

  filesToCopy.forEach((file) => {
    copyFileSync(
      resolve(starterConfigPathDir, file),
      join(libPackageConfigPathDir, file)
    )
  })

  filesToRemove.forEach((file) => {
    const pathFile = join(libPackageConfigPathDir, file)
    if (existsSync(pathFile)) {
      unlinkSync(pathFile)
    }
  })

  log('==config/ updated ✅ ==\n')
}

function updateScriptsDir() {
  const starterScriptsPathDir = resolve(ROOT, 'scripts')
  const libPackageScriptsPathDir = resolve(PACKAGE_ROOT, 'scripts')

  const filesToCopy = ['copy.js', 'tsconfig.json']
  /**
   * @type {string[]}
   */
  const filesToRemove = ['migrate.js']

  filesToCopy.forEach((file) => {
    copyFileSync(
      resolve(starterScriptsPathDir, file),
      join(libPackageScriptsPathDir, file)
    )
  })

  filesToRemove.forEach((file) => {
    const pathFile = join(libPackageScriptsPathDir, file)
    if (existsSync(pathFile)) {
      unlinkSync(pathFile)
    }
  })

  log('==scripts/ updated  ✅  ==\n')
}

function updatePrettierIgnore() {
  const starterPrettierIgnorePath = resolve(ROOT, '.prettierignore')
  const libPackagePrettierIgnorePath = resolve(PACKAGE_ROOT, '.prettierignore')

  copyFileSync(starterPrettierIgnorePath, libPackagePrettierIgnorePath)

  log('==.prettierignore updated  ✅  ==\n')
}
