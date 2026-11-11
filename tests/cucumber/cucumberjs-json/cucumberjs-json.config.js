import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from '../../helpers/config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = Object.assign({}, baseConfig, {
    framework: 'cucumber',
    reporters: [['cucumberjs-json', { jsonFolder: path.join(__dirname, 'json') }]],
    cucumberOpts: {
        ...baseConfig.cucumberOpts,
        require: [path.join(__dirname, 'cucumberjs-json.steps.js')]
    }
})
