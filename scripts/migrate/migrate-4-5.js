/**
 * Migrate Typescript-library-starter from 4. -> 5.
 */

const { writeFileSync, readFileSync, existsSync } = require('fs')
const { resolve, join } = require('path')

const kleur = require('kleur')

const sh = require('shelljs')
const JSON5 = require('json5')
const sortObjectByKeyNameList = require('sort-object-keys')

const starterPkg = require('../../package.json')
const args = process.argv.slice(2)
const pathToProject = args[0]
const { log } = console

if (!pathToProject) {
  usage('4', '5')

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
  updateRcFiles()
  updatePrettier()
  updateConfigDir()
  updateScriptsDir()
  updateVSCodeDir()

  log(kleur.cyan('DONE ✅'))
  log(kleur.inverse().cyan('Make sure run yarn, to update yarn.lock 🤙'))
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
    'lint-staged': starterPkg['lint-staged'],
  }

  removeScripts(updatePkg.scripts)
  removePackages(updatePkg.devDependencies)

  writePackage(updatePkg)

  /**
   *
   * @param {{[packageName:string]:string}} scripts
   */
  function removeScripts(scripts) {
    /** @type {string[]} */
    const scriptsToRemove = ['size:umd', 'size:fesm', 'postinstall']

    scriptsToRemove.forEach((scriptName) => delete scripts[scriptName])
  }

  /**
   *
   * @param {{[packageName:string]:string}} devDependencies
   */
  function removePackages(devDependencies) {
    const depsToRemove = [
      // packages needed for this script
      'json5',
      '@types/json5',
      'sort-package-json',
      'sort-object-keys',
      'shelljs',
      // packages needed for init script
      'prompts',
      '@types/prompts',
      'replace-in-file',
      // v4 -> v5
      'gzip-size-cli',
      'strip-json-comments-cli',
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
      '\n' +
        kleur.green('updated package.json:') +
        '\n' +
        updatedLibPkgToWrite +
        '\n' +
        kleur.gray('========================\n')
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

  log(kleur.green('==TS-Config:updated ☕️ ✅ ==\n'))
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

  log(kleur.yellow('==TS-Lint:nothing updated ☕️ ==\n'))
}

function updateConfigDir() {
  const starterPathDir = resolve(ROOT, 'config')
  const libConfigPathDir = resolve(PACKAGE_ROOT, 'config')

  /** @type {string[]} */
  const cpFiles = ['global.d.ts']
  /** @type {string[]} */
  const rmFiles = ['prettier.config.js']

  const cpItems = cpFiles.map((file) => join(starterPathDir, file))
  const rmItems = rmFiles.map((file) => join(libConfigPathDir, file))

  sh.cp('-Rf', cpItems, `${libConfigPathDir}/`)
  sh.rm('-Rf', rmItems)

  log(kleur.underline().white('==📁 config/ updated ✅ =='))
  log(kleur.red('Removed: \n ' + rmItems.join('\n')))
  log(kleur.yellow('Copied: \n ' + cpItems.join('\n')))
}

function updateScriptsDir() {
  const starterPathDir = resolve(ROOT, 'scripts')
  const libPackagePathDir = resolve(PACKAGE_ROOT, 'scripts')

  const cpFiles = ['copy.js', 'file-size.js', 'build.js', 'tsconfig.json']
  /** @type {string[]} */
  const rmFiles = []
  const rmDirs = ['migrate']

  const cpItems = cpFiles.map((file) => join(starterPathDir, file))
  const rmItems = [...rmDirs, ...rmFiles].map((file) =>
    join(libPackagePathDir, file)
  )

  sh.cp('-Rf', cpItems, `${libPackagePathDir}/`)
  // 'rm' command checks the item type before attempting to remove it
  sh.rm('-Rf', rmItems)

  log(kleur.underline().white('==📁 scripts/ updated ✅ =='))
  log(kleur.red('Removed: \n ' + rmItems.join('\n')))
  log(kleur.yellow('Copied: \n ' + cpItems.join('\n')))
}

function updateVSCodeDir() {
  const libPackagePathDir = resolve(PACKAGE_ROOT, '.vscode')

  const cpDirs = ['.vscode']
  const cpItems = [...cpDirs.map((path) => `${join(ROOT, path)}/*`)]

  sh.cp('-Rf', cpItems, `${libPackagePathDir}/`)

  log(kleur.green('==.vscode updated  ✅  ==\n'))
}

function updatePrettier() {
  const libPackagePath = PACKAGE_ROOT

  const cpFiles = ['.prettierignore', '.prettierrc'].map((path) =>
    join(ROOT, path)
  )

  sh.cp('-Rf', cpFiles, `${libPackagePath}/`)

  log(kleur.green('==prettier config updated  ✅  ==\n'))
}

function updateRcFiles() {
  const libPackagePath = PACKAGE_ROOT

  const cpFiles = ['.travis.yml']

  const cpItems = cpFiles.map((path) => join(ROOT, path))

  sh.cp('-Rf', cpItems, `${libPackagePath}/`)

  log(kleur.underline().white('== rc/config root files updated ✅ =='))
  log(kleur.yellow('Copied: \n ' + cpItems.join('\n')))
}
