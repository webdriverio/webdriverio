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
    beforeSession (_config, capabilities) {
        fs.writeFileSync(headlessCapsLog, JSON.stringify(capabilities))
    }
})
