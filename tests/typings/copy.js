const rimraf = require('rimraf')
const copyfiles = require('copyfiles')
const path = require('path')

// TypeScript project root for testing particular typings
const outDirs = ['sync', 'sync-mocha', 'sync-jasmine', 'webdriverio', 'webdriverio-mocha', 'webdriverio-jasmine']

const packages = {
    'webdriver': 'packages/webdriver',
    '@wdio/sync': 'packages/wdio-sync',
    'webdriverio': 'packages/webdriverio',
    '@wdio/allure-reporter': 'packages/wdio-allure-reporter',

    '@types/mocha': 'packages/wdio-mocha-framework/node_modules/@types/mocha',
    '@wdio/mocha-framework': 'packages/wdio-mocha-framework',

    '@types/jasmine': 'packages/wdio-jasmine-framework/node_modules/@types/jasmine',
    '@types/jasmine/ts3.1': 'packages/wdio-jasmine-framework/node_modules/@types/jasmine/ts3.1',
    '@wdio/jasmine-framework': 'packages/wdio-jasmine-framework',

    '@types/selenium-standalone': 'packages/wdio-selenium-standalone-service/node_modules/@types/selenium-standalone',
    '@wdio/selenium-standalone-service': 'packages/wdio-selenium-standalone-service',
}

/**
 * copy package.json and typings from package to type-generation/test/.../node_modules
 */
async function copy() {
    for (const outDir of outDirs) {
        for (const packageName of Object.keys(packages)) {
            const packageDir = packages[packageName]
            const packageJson = path.join(packageDir, 'package.json')
            const typings = path.join(packageDir, '*.d.ts')
            const destination = path.join(__dirname, outDir, 'node_modules', packageName)

            await new Promise(resolve => copyfiles([packageJson, typings, destination], { up: packageDir.split('/').length }, resolve))
        }
    }
}

rimraf('tests/typings/**/node_modules/', error => {
    if (!error) {
        return copy()
    }
    throw new Error(error)
})
