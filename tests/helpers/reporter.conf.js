import url from 'node:url'
import path from 'node:path'

import { config as baseConfig } from './config.js'
import reporter from '../../packages/wdio-smoke-test-reporter/build/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = Object.assign({}, baseConfig, {
    reporters: ['spec', reporter],
    specs: [path.resolve(__dirname, '..', 'mocha', 'reporter.js')],
})
