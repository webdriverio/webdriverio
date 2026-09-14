/* istanbul ignore file */

import { DEFAULT_CONFIGS, DEFAULT_MAX_INSTANCES_PER_CAPABILITY_VALUE } from './constants.js'
import { defineConfig, validateConfig, isCloudCapability } from './utils.js'

export {
    /**
     * configuration helpers
     */
    validateConfig,
    defineConfig,
    isCloudCapability,

    /**
     * constants
     */
    DEFAULT_CONFIGS,
    DEFAULT_MAX_INSTANCES_PER_CAPABILITY_VALUE
}

export * from './types.js'
