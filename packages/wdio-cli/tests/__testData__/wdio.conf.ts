import path from 'path'

const TEST_ROOT = path.join(__dirname, '..')

import type { Options } from '@wdio/types'

export const config: Options.Testrunner = {
    user: 'foobar',
    key: '50fa142c-3121-4gb0-9p07-8q326vvbq7b0',
    specs: [path.join(TEST_ROOT, '*.test.ts')],
    exclude: [
        path.join(TEST_ROOT, '/validateConfig.test.ts')
    ],
    capabilities: {
        'myCapabilities': {
            // maxInstances can get overwritten per capability. So if you have an in-house Selenium
            // grid with only 5 firefox instances available you can make sure that not more than
            // 5 instances get started at a time.
            maxInstances: 5,
            //
            browserName: 'chrome',
            acceptInsecureCerts: true,
            'goog:chromeOptions': { 'args': ['window-size=8000,1200'] }
            // If outputDir is provided WebdriverIO can capture driver session logs
            // it is possible to configure which logTypes to include/exclude.
            // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
            // excludeDriverLogs: ['bugreport', 'server'],
            //
        }
    },

    suites: {
        unit: [path.join(TEST_ROOT, 'configparser.test.ts')],
        mobile: [path.join(TEST_ROOT, 'RequireLibrary.test.ts')],
        functional: [
            path.join(TEST_ROOT, 'validateConfig.test.ts'),
            path.join(TEST_ROOT, '..', 'src/index.ts')
        ]
    }
}
