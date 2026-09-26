import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    specs: [
        path.join(__dirname, 'base-install.e2e.ts')
    ],

    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--headless=new',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ],
        },
    }],

    logLevel: 'info',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs'),
    runner: 'local',

    // Tests drive the display server manually rather than auto-initializing.
    displayServerEnabled: false,
    displayServerAutoInstall: false,

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 300000, // 5 minutes to allow for package installation
        require: []
    },
}
