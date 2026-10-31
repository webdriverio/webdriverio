import type { Server } from 'node:http'
import url from 'node:url'
import path from 'node:path'
import { startParallelFixtureServer, stopParallelFixtureServer } from './parallelFixtureServer.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

let server: Server

export const config: WebdriverIO.Config = {
    /**
     * specify test files
     */
    specs: [
        path.join(__dirname, 'headless', 'parallel.e2e.ts'),
        path.join(__dirname, 'headless', 'parallel-storage.e2e.ts'),
        path.join(__dirname, 'headless', 'parallel-mocks.e2e.ts')
    ],

    /**
     * capabilities
     */
    maxInstances: 1,
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: true,
        'wdio:experimentalBiDiCommands': true,
        'goog:chromeOptions': {
            args: [
                'headless',
                'disable-gpu'
            ]
        }
    }],

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'mocha',
    outputDir: __dirname,
    reporters: ['spec'],

    onPrepare: async () => {
        server = await startParallelFixtureServer()
    },
    onComplete: async () => {
        await stopParallelFixtureServer(server)
    },
    beforeSuite: async (suite) => {
        // a mock outside the test windows, which mockRestoreAll() in a test keeps
        if (suite.file.endsWith('parallel-mocks.e2e.ts')) {
            const suiteWide = await browser.mock('**/api/suite-wide')
            suiteWide.respond('mocked', { headers: { 'Content-Type': 'text/plain' }, fetchResponse: false })
        }
    },

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        parallelMode: 'contexts',
        maxParallelContexts: 2
    }
}
