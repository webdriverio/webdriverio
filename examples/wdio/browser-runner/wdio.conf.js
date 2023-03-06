import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import { loadEnv } from 'vite'

/**
 * WebdriverIO is using this example to test its component testing features
 * and we have experienced issues with Vue when running in Windows,
 * see https://github.com/testing-library/vue-testing-library/issues/292
 * Please ignore and remove this in your project!
 */
if (process.env.CI && process.env.WDIO_PRESET === 'vue' && os.platform() === 'win32') {
    process.exit(0)
}

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
export const config = {
    /**
     * specify test files
     */
    specs: [
        path.resolve(__dirname, '*.test.tsx'),
        path.resolve(__dirname, '*.test.js')
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        acceptInsecureCerts: true
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs', process.env.WDIO_PRESET),
    reporters: ['spec', 'dot', 'junit'],
    services: ['chromedriver'],
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        viteConfig: ({ command, mode }) => {
            const env = loadEnv(mode, __dirname, '')
            return {
                // vite config
                define: {
                    WDIO_ENV_TEST: `${JSON.stringify(env.WDIO_ENV_TEST)}`,
                    TEST_COMMAND: `${JSON.stringify(command)}`
                },
            }
        },
        coverage: {
            enabled: true,
            functions: 100
        }
    }],

    mochaOpts: {
        ui: 'bdd',
        timeout: 150000
    }
}
