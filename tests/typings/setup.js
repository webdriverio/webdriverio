import { mkdir, rm, symlink } from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const TS_PARAMETER = '--ts='
const tsArg = process.argv.find((v) => v.startsWith(TS_PARAMETER))
const tsVersion = tsArg ? tsArg.slice(TS_PARAMETER.length) : undefined
const tsDir = tsVersion ? path.join(__dirname, '@typescript', `ts${tsVersion}`) : ''

// TypeScript project root for testing particular typings
const outDirs = [
    'devtools', 'webdriverio', 'webdriver', 'mocha', 'jasmine', 'cucumber'
]

const packages = {
    'devtools': 'packages/devtools',
    'webdriver': 'packages/webdriver',
    'webdriverio': 'packages/webdriverio',
    '@wdio/globals': 'packages/wdio-globals',
    '@wdio/browser-runner': 'packages/wdio-browser-runner',
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
    '@wdio/selenium-standalone-service': 'packages/wdio-selenium-standalone-service',
    '@wdio/shared-store-service': 'packages/wdio-shared-store-service',
    '@wdio/static-server-service': 'packages/wdio-static-server-service',
    '@wdio/sumologic-reporter': 'packages/wdio-sumologic-reporter',
    '@wdio/testingbot-service': 'packages/wdio-testingbot-service',
    // '@types/puppeteer': 'packages/webdriverio/node_modules/@types/puppeteer'
}

/**
 * copy package.json and typings from package to type-generation/test/.../node_modules
 */
async function copy() {
    if (tsVersion) {
        spawnSync('npm', ['ci'], { cwd: tsDir })
    }
    await Promise.all(
        outDirs.map(async (outDir) => {
            await Promise.all(Object.keys(packages).map(async (packageName) => {
                const destination = path.join(__dirname, outDir, 'node_modules', packageName)
                const packageDir = packages[packageName]
                const destDir = destination.split(path.sep).slice(0, -1).join(path.sep)
                const target = path.join(ROOT, packageDir)
                await mkdir(destDir, { recursive: true })
                return symlink(target, destination, 'dir')
            }))
            if (tsVersion) {
                const typescriptDirs = ['typescript', '.bin']
                await Promise.all(typescriptDirs.map((d) =>
                    symlink(
                        path.join(tsDir, 'node_modules', d),
                        path.join(__dirname, outDir, 'node_modules', d),
                        'dir'
                    )
                ))
            }
        })
    )
}

/**
 * delete eventual artifacts from test folders
 */
async function clean() {
    const artifactDirs = ['node_modules', 'dist']
    await Promise.all(artifactDirs.map((dir) =>
        Promise.all(outDirs.map((outDir) =>
            rm(path.join(__dirname, outDir, dir), { recursive: true, force: true })
        ))
    ))
}

await clean()
await copy()
