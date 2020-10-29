import ConfigParser from './lib/ConfigParser'
import { validateConfig, getSauceEndpoint, detectBackend, isCloudCapability } from './utils'
import { DEFAULT_CONFIGS } from './constants'

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
