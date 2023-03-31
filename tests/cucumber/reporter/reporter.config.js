import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from '../../helpers/config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const reporterConfig = Object.assign({}, baseConfig, {
    framework: 'cucumber',
    reporters: [['smoke-test', { foo: 'bar' }]]
})

reporterConfig.cucumberOpts.require = [path.join(__dirname, 'reporter.given.js')]

export const config = reporterConfig
