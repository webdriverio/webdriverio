import path from 'node:path'
import url from 'node:url'

import reporter from '../../packages/wdio-smoke-test-reporter/build/index.js'
import { config as baseConfig } from './config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = Object.assign({}, baseConfig, {
    reporters: ['spec', reporter],
    specs: [path.resolve(__dirname, '..', 'mocha', 'reporter.js')],
})
