const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const { spawnSync } = require('child_process')

const { ln, mkdir } = require('shelljs')
const rimraf = require('rimraf')

const ROOT = path.resolve(__dirname, '..', '..')

// TypeScript project root for testing particular typings
const outDirs = [
    'devtools', 'sync-devtools', 'webdriverio', 'webdriver', 'mocha', 'jasmine', 'cucumber', 'sync'
]

const packages = {
    'devtools': 'packages/devtools',
    'webdriver': 'packages/webdriver',
    'webdriverio': 'packages/webdriverio',
    '@wdio/reporter': 'packages/wdio-reporter',
    '@wdio/allure-reporter': 'packages/wdio-allure-reporter',
    '@wdio/appium-service': 'packages/wdio-appium-service',
    '@wdio/browserstack-service': 'packages/wdio-browserstack-service',
    '@wdio/crossbrowsertesting-service': 'packages/wdio-crossbrowsertesting-service',
    '@wdio/cucumber-framework': 'packages/wdio-cucumber-framework',
    '@wdio/devtools-service': 'packages/wdio-devtools-service',
    '@wdio/firefox-profile-service': 'packages/wdio-firefox-profile-service',
    '@wdio/jasmine-framework': 'packages/wdio-jasmine-framework',
    '@wdio/mocha-framework': 'packages/wdio-mocha-framework',
    '@wdio/protocols': 'packages/wdio-protocols',
    '@wdio/sauce-service': 'packages/wdio-sauce-service',
    '@wdio/sumologic-reporter': 'packages/wdio-sumologic-reporter',
    '@wdio/selenium-standalone-service': 'packages/wdio-selenium-standalone-service',
    '@wdio/shared-store-service': 'packages/wdio-shared-store-service',
    '@wdio/static-server-service': 'packages/wdio-static-server-service',
    '@wdio/testingbot-service': 'packages/wdio-testingbot-service',
    '@types/puppeteer': 'packages/webdriverio/node_modules/@types/puppeteer'
}

const artifactDirs = ['node_modules', 'dist']

const typescriptDirs = ['typescript', '.bin']
const TS_PARAMETER = '--ts='
let tsVersion = process.argv.find((v) => v.startsWith(TS_PARAMETER))
if (tsVersion) {
    tsVersion = tsVersion.substr(TS_PARAMETER.length)
}
const tsDir = path.join(__dirname, '@typescript', `ts${tsVersion}`)

/**
 * copy package.json and typings from package to type-generation/test/.../node_modules
 */
async function copy() {
    if (tsVersion) {
        spawnSync('npm', ['ci'], { cwd: tsDir })
    }
    for (const outDir of outDirs) {
        for (const packageName of Object.keys(packages)) {
            const destination = path.join(__dirname, outDir, 'node_modules', packageName)
            const packageDir = packages[packageName]

            const destDir = destination.split(path.sep).slice(0, -1).join(path.sep)
            if (!fs.existsSync(destDir)) {
                mkdir('-p', destDir)
            }

            ln('-s', path.join(ROOT, packageDir), destination)
        }
        if (tsVersion) {
            typescriptDirs.forEach((d) => {
                ln(
                    '-s',
                    path.join(tsDir, 'node_modules', d),
                    path.join(__dirname, outDir, 'node_modules', d)
                )
            })
        }
    }
}

/**
 * delete eventual artifacts from test folders
 */
Promise.all(
    artifactDirs.map(
        (dir) => Promise.all(
            outDirs.map(
                (testDir) => promisify(rimraf)(path.join(__dirname, testDir, dir))
            )
        )
    )
).then(
    /**
     * if successful, start test
     */
    () => copy(),
    /**
     * on failure, error out
     */
    (err) => {
        console.error(err.stack)
        process.exit(1)
    }
)
