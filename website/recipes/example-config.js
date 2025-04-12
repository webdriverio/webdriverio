import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    runner: 'local',
    specs: [
        'test/spec/**',
        ['group/spec/**']
    ],
    maxInstances: 10,
    capabilities: [
        {
            browserName: 'chrome',
        },
        {
            browserName: 'firefox',
        }
    ],
    logLevel: 'info',
    outputDir: './logs',
    baseUrl: 'http://localhost:8080',
    waitforTimeout: 30000,
    framework: 'mocha',
    reporters: [
        'dot',
        'allure'
    ],
    mochaOpts: {
        ui: 'bdd'
    },
})