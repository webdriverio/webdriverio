import path from 'node:path'
import url from 'node:url'

import { config as baseConfig } from './config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

// only the step of the feature, so that its rejection comes after the last hook of Cucumber
export const config = Object.assign({}, baseConfig, {
    framework: 'cucumber',
    cucumberOpts: {
        ...baseConfig.cucumberOpts,
        require: [path.resolve(__dirname, '..', 'cucumber', 'late-rejection', 'steps.js')]
    }
})
