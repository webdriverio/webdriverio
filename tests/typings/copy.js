const fs = require('fs')
const path = require('path')

const { ln, mkdir } = require('shelljs')
const rimraf = require('rimraf')

const ROOT = path.resolve(__dirname, '..', '..')

// TypeScript project root for testing particular typings
const outDirs = [
    'sync', 'sync-applitools', 'sync-browserstack', 'sync-mocha', 'sync-jasmine', 'webdriverio', 'webdriverio-applitools',
    'webdriverio-browserstack', 'webdriverio-mocha', 'webdriverio-jasmine', 'sync-cucumber', 'devtools', 'sync-devtools',
    'webdriverio-reporter', 'webdriverio-saucelabs', 'sync-saucelabs'
]

const packages = {
    'devtools': 'packages/devtools',
    'webdriver': 'packages/webdriver',
    '@wdio/sync': 'packages/wdio-sync',
    'webdriverio': 'packages/webdriverio',
    '@wdio/allure-reporter': 'packages/wdio-allure-reporter',
    '@wdio/reporter': 'packages/wdio-reporter',
    '@wdio/applitools-service': 'packages/wdio-applitools-service',
    '@wdio/browserstack-service': 'packages/wdio-browserstack-service',
    '@wdio/sauce-service': 'packages/wdio-sauce-service',
    '@wdio/mocha-framework': 'packages/wdio-mocha-framework',
    '@wdio/cucumber-framework': 'packages/wdio-cucumber-framework',
    '@wdio/jasmine-framework': 'packages/wdio-jasmine-framework',
    '@wdio/selenium-standalone-service': 'packages/wdio-selenium-standalone-service',
    '@wdio/shared-store-service': 'packages/wdio-shared-store-service'
}

/**
 * copy package.json and typings from package to type-generation/test/.../node_modules
 */
async function copy() {
    for (const outDir of outDirs) {
        for (const packageName of Object.keys(packages)) {
            const destination = path.join(__dirname, outDir, 'node_modules', packageName)
            const packageDir = packages[packageName]

            const destDir = destination.split('/').slice(0, -1).join('/')
            if (!fs.existsSync(destDir)) {
                mkdir('-p', destDir)
            }

            ln('-s', path.join(ROOT, packageDir), destination)
        }
    }
}

rimraf('tests/typings/**/node_modules/', error => {
    if (!error) {
        return copy()
    }
    throw new Error(error)
})
