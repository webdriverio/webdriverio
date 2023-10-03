import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from './wdio.conf.js'

import { setValue } from '../../packages/wdio-shared-store-service/build/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = {
    ...baseConfig,

    specs: [path.resolve(__dirname, 'headless', 'multiremoteTest.e2e.ts')],
    exclude: [],
    capabilities: [
        {
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: 'stable',
                    'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: 'stable',
                    'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
                }
            },
        },
        {
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: 'stable',
                    'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: 'stable',
                    'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
                }
            },
        }
    ],

    /**
     * include shared store service for e2e tests
     */
    services: ['shared-store', 'devtools'],
    onPrepare: () => setValue('foo', 'bar')
}
