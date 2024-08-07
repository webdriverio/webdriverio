import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'rollup'

import { getRollupConfig } from '../../scripts/rollup.config.js'
import pkg from './package.json' assert { type: 'json' }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/** @type {import('rollup').RollupOptions} */
export default defineConfig(getRollupConfig(__dirname, pkg, {
    cjs: {
        /**
         * set a plugin that removes the dual socket implementation
         * as we don't expect people to load CJS code in the browser
         */
        plugins: [
            {
                name: 'webdriver:no-browser-socket',
                transform (code, id) {
                    if (id.endsWith('src/bidi/socket.ts')) {
                        return 'import ws from \'ws\'\nexport default ws'
                    }

                    return code
                }
            }
        ]
    },
}))
