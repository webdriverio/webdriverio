const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const { ln, mkdir } = require('shelljs')
const rimraf = require('rimraf')

const ROOT = path.resolve(__dirname, '..', '..')

// TypeScript project root for testing particular typings
const outDirs = [
    'sync', 'sync-applitools', 'sync-browserstack', 'sync-mocha', 'sync-jasmine',
    'webdriverio', 'webdriverio-applitools', 'webdriverio-browserstack',
    'webdriverio-mocha', 'webdriverio-jasmine', 'webdriverio-cucumber',
    'sync-cucumber', 'devtools', 'sync-devtools', 'webdriverio-reporter',
    'webdriverio-saucelabs', 'sync-saucelabs', 'webdriverio-devtools-service', 'sync-devtools-service'
]

const packages = {
    'devtools': 'packages/devtools',
    'webdriver': 'packages/webdriver',
    'webdriverio': 'packages/webdriverio',
    '@wdio/sync': 'packages/wdio-sync',
    '@wdio/reporter': 'packages/wdio-reporter',
    '@wdio/allure-reporter': 'packages/wdio-allure-reporter',
    '@wdio/appium-service': 'packages/wdio-appium-service',
    '@wdio/applitools-service': 'packages/wdio-applitools-service',
    '@wdio/browserstack-service': 'packages/wdio-browserstack-service',
    '@wdio/crossbrowsertesting-service': 'packages/wdio-crossbrowsertesting-service',
    '@wdio/cucumber-framework': 'packages/wdio-cucumber-framework',
    '@wdio/devtools-service': 'packages/wdio-devtools-service',
    '@wdio/firefox-profile-service': 'packages/wdio-firefox-profile-service',
    '@wdio/jasmine-framework': 'packages/wdio-jasmine-framework',
    '@wdio/mocha-framework': 'packages/wdio-mocha-framework',
    '@wdio/protocols': 'packages/wdio-protocols',
    '@wdio/sauce-service': 'packages/wdio-sauce-service',
    '@wdio/selenium-standalone-service': 'packages/wdio-selenium-standalone-service',
    '@wdio/shared-store-service': 'packages/wdio-shared-store-service',
    '@wdio/static-server-service': 'packages/wdio-static-server-service',
    '@wdio/testingbot-service': 'packages/wdio-testingbot-service',
    '@types/puppeteer': 'packages/webdriverio/node_modules/@types/puppeteer'
}

const artifactDirs = ['node_modules', 'dist']

/**
 * copy package.json and typings from package to type-generation/test/.../node_modules
 */
async function copy() {
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
