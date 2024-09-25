import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    specs: [path.join(__dirname, '*.test.js')],
    suites: {
        pageWeight: ['./pageWeight.e2e.js'],
        scriptBlocking: ['./scriptBlocking.e2e.js']
    },
    logLevel: 'trace',
    baseUrl: 'https://magnificent-cabbage.glitch.me',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs'),
    reporters: ['spec'],
    services: ['lighthouse'],
    capabilities: [{
        browserName: 'chrome'
    }],
    mochaOpts: {
        ui: 'bdd',
        timeout: 30000
    }
}
