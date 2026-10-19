import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from '../../helpers/config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * 2 of 5 feature files have a `@wanted` tag, the last 2 untagged files run in one worker (grouped specs)
 */
export const config = Object.assign({}, baseConfig, {
    framework: 'cucumber',
    specs: [
        path.join(__dirname, 'tagged-feature.feature'),
        path.join(__dirname, 'tagged-scenario.feature'),
        path.join(__dirname, 'untagged-a.feature'),
        [path.join(__dirname, 'untagged-b.feature'), path.join(__dirname, 'untagged-c.feature')]
    ],
    cucumberOpts: {
        ...baseConfig.cucumberOpts,
        require: [path.join(__dirname, 'steps.js')]
    }
})
