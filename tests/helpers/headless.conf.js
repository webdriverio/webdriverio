import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

import { config as baseConfig } from './config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * The mock driver's newSession response does not echo the requested
 * capabilities, so the spec cannot see the args `--headless` rewrote.
 * Record the capabilities the worker is about to send.
 */
export const headlessCapsLog = path.resolve(__dirname, 'headless-caps.log')

export const config = Object.assign({}, baseConfig, {
    specs: [path.resolve(__dirname, '..', 'mocha', 'service.js')],
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
    }],
    strictSelectors: false,
    /**
     * The CLI process itself must not see `WDIO_UNIT_TESTS`, or a failed run
     * exits 0. Workers still need it so session startup skips `getWindowHandle`,
     * which the mock driver does not implement.
     */
    runnerEnv: {
        ...(baseConfig.runnerEnv || {}),
        WDIO_UNIT_TESTS: '1'
    },
    beforeSession (_config, capabilities) {
        fs.writeFileSync(headlessCapsLog, JSON.stringify(capabilities))
    }
})
