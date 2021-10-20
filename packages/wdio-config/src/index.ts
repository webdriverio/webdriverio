/* istanbul ignore file */

import { DEFAULT_CONFIGS } from './constants'
import { validateConfig, isCloudCapability } from './utils'
import ConfigParser from './lib/ConfigParser'

export {
    validateConfig,
    isCloudCapability,
    ConfigParser,

    /**
     * constants
     */
    DEFAULT_CONFIGS
}

export * from './types'
