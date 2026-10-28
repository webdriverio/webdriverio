import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from '../../helpers/config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * 2 feature files in one worker (grouped specs), with the scenarios in a random order
 */
export const config = Object.assign({}, baseConfig, {
    framework: 'cucumber',
    specs: [[path.join(__dirname, 'a.feature'), path.join(__dirname, 'b.feature')]],
    cucumberOpts: {
        ...baseConfig.cucumberOpts,
        require: [path.join(__dirname, 'steps.js')],
        // this seed mixes the scenarios of the 2 features
        order: 'random:42'
    }
})
