import url from 'node:url'
import path from 'node:path'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const outputDirPathAllPassed = path.resolve(__dirname, 'logs-AllPassedSpec')

export const config =
    {
        capabilities: [{
            browserName: 'chrome'
        }],
        logLevel: 'trace',
        framework: 'mocha',

        reporters: ['spec'],
        services: ['webdriver-mock'],

        mochaOpts: {
            ui: 'bdd',
            timeout: 15000
        },
        specs:
        [
            path.resolve(__dirname, 'mocha.test04.js'),
            [
                path.resolve(__dirname, 'mocha.test02.js'),
                path.resolve(__dirname, 'mocha.test03.js')
            ],
            [
                path.resolve(__dirname, 'mocha.test01.js')
            ]
        ],
        outputDir: outputDirPathAllPassed
    }
