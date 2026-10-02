import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import { cacheDir } from './helpers.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

if (!process.env.CHROMIUM_130_BINARY) {
    throw new Error('Set CHROMIUM_130_BINARY to a Chromium 130 build')
}

const chromium130 = {
    binary: process.env.CHROMIUM_130_BINARY,
    args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage']
}

export const config: WebdriverIO.Config = {
    capabilities: [...(process.platform === 'linux' && process.arch === 'arm64' ? [{
        browserName: 'chrome',
        'goog:chromeOptions': chromium130,
        'wdio:specs': [path.join(__dirname, 'electron-fallback.e2e.ts')]
    }] : []), {
        browserName: 'chrome',
        'goog:chromeOptions': chromium130,
        'wdio:electronVersion': '33.2.1',
        'wdio:specs': [path.join(__dirname, 'electron-version.e2e.ts')]
    }],
    // parallel installs into one cache directory can race
    maxInstances: 1,
    cacheDir,
    logLevel: 'warn',
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd'
    },
    onPrepare: () => fs.rmSync(cacheDir, { recursive: true, force: true })
}
