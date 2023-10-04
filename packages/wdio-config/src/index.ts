/* istanbul ignore file */

import { DEFAULT_CONFIGS } from './constants.js'
import { validateConfig, isCloudCapability, isAppiumCapability } from './utils.js'
import ConfigParser from './lib/ConfigParser.js'

export {
    validateConfig,
    isCloudCapability,
    isAppiumCapability,
    ConfigParser,

    /**
     * constants
     */
    DEFAULT_CONFIGS
}

export * from './types.js'
