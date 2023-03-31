import path from 'node:path'
import type { Options } from '@wdio/types'

const TEST_ROOT = path.join(__dirname, '..')

export const config: Options.Testrunner = {
    user: 'foobar',
    key: '50fa142c-3121-4gb0-9p07-8q326vvbq7b0',
    specs: [path.join(TEST_ROOT, '*.test.ts')],
    exclude: [
        path.join(TEST_ROOT, '/RequireLibrary.test.ts'),
        path.join(TEST_ROOT, '/validateConfig.test.ts')
    ],
    region: 'eu',
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome',
                testobject_api_key: '1',
            }
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
