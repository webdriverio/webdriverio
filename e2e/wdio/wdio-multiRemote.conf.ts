import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from './wdio.conf.js'

import { setValue } from '@wdio/shared-store-service'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const isLinux = os.platform() === 'linux'

export const config: WebdriverIO.MultiremoteConfig = {
    ...baseConfig,

    specs: [path.resolve(__dirname, 'headless', 'multiRemoteTest.e2e.ts')],
    exclude: [],
    capabilities: [
        {
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: 'stable',
                    'goog:chromeOptions': {
                        args: ['headless', 'disable-gpu']
                    }
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: 'stable',
                    'moz:firefoxOptions': {
                        args: ['-headless']
                    }
                }
            },
            browserC: {
                capabilities: {
                    browserName: 'chromium',
                    browserVersion: 'latest',
                    'goog:chromeOptions': {
                        args: [
                            'headless',
                            'disable-gpu',
                            // Having `WebDriverError: session not created: Chrome instance exited` since ubuntu 22.04 to 24.04, since the below is no more wrapped by default.
                            // See https://github.com/webdriverio/webdriverio/issues/14168.
                            ...(isLinux ? ['no-sandbox'] : [])
                        ]
                    }
                }
            },
        },
    ],

    /**
     * include shared store service for e2e tests
     */
    services: ['shared-store', 'lighthouse'],
    onPrepare: () => setValue('foo', 'bar')
}
