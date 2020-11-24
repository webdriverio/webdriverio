/* istanbul ignore file */

import ConfigParser from './lib/ConfigParser'
import { validateConfig, getSauceEndpoint, detectBackend, isCloudCapability } from './utils'
import { DEFAULT_CONFIGS } from './constants'

export * from './types'
export {
    validateConfig,
    getSauceEndpoint,
    detectBackend,
    isCloudCapability,
    ConfigParser,

    /**
     * constants
     */
    DEFAULT_CONFIGS
}
