import os from 'node:os'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const isLinux = os.platform() === 'linux'
const isCI = Boolean(process.env.CI)

export const config: WebdriverIO.Config = {
    specs: [
        path.join(__dirname, 'headless', 'lighthouse.e2e.ts')
    ],
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        'goog:chromeOptions': {
            args: [
                'headless',
                'disable-gpu',
                'window-size=1920,1080',
                ...(isLinux && isCI ? ['no-sandbox'] : []),
                ...(isCI ? ['disable-dev-shm-usage'] : [])
            ]
        }
    }],
    services: ['lighthouse'],
    maxInstances: 1,
    bail: 1,
    logLevel: 'info',
    framework: 'mocha',
    outputDir: __dirname,
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 180000
    }
}
