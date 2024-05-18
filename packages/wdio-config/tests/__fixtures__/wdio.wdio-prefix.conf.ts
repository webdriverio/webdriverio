import path from 'node:path'
import url from 'node:url'

import type { Testrunner } from '../../../wdio-types/src/Options.js'
import { config as baseConfig } from './wdio.conf.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const _config: Testrunner = {
    ...baseConfig,
    specs: [
        path.resolve(__dirname, '**/*.ts')
    ],
    exclude: [
        path.resolve(__dirname, 'test.es6')
    ],
    capabilities: [
        {
            browserName: 'chrome',
            'wdio:maxInstances': 4711,
            'wdio:specs': [
                path.resolve(__dirname, 'prefix-test-01.ts')
            ],
            'wdio:exclude': [
                path.resolve(__dirname, 'prefix-test-02.ts')
            ]
        },
        {
            browserName: 'safari',
            'wdio:maxInstances': 4711,
            'wdio:specs': [
                path.resolve(__dirname, 'prefix-test-02.ts')
            ]
        }]
}

export { _config as config }

