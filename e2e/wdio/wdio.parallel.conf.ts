import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    /**
     * specify test files
     */
    specs: [
        path.join(__dirname, 'headless', 'parallel.e2e.ts')
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: true,
        'wdio:experimentalBiDiCommands': true,
        maxInstances: 1,
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

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        parallelMode: 'contexts',
        maxParallelContexts: 2
    }
}
