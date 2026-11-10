import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from '../../helpers/config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * 2 feature files with the same file name in other folders, in one worker (grouped specs)
 */
export const config = Object.assign({}, baseConfig, {
    framework: 'cucumber',
    specs: [[path.join(__dirname, 'admin', 'login.feature'), path.join(__dirname, 'user', 'login.feature')]],
    cucumberOpts: {
        ...baseConfig.cucumberOpts,
        require: [path.join(__dirname, 'steps.js')]
    }
})
