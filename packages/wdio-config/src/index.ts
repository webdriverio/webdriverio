/* istanbul ignore file */

import ConfigParser from './lib/ConfigParser'
import { validateConfig, getSauceEndpoint, detectBackend, isCloudCapability } from './utils'
import { DEFAULT_CONFIGS } from './constants'
import { ConfigOptions } from './types'

export * from './types'
export {
    validateConfig,
    getSauceEndpoint,
    detectBackend,
    isCloudCapability,
    ConfigParser,
    ConfigOptions,

    /**
     * constants
     */
    DEFAULT_CONFIGS
}
