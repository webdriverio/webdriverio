import { vi } from 'vitest'
import {
    isCloudCapability as isCloudCapabilityMock,
    validateConfig as validateConfigMock
} from '../../packages/wdio-config/src/utils.js'

export { DEFAULT_CONFIGS, DEFAULT_MAX_INSTANCES_PER_CAPABILITY_VALUE } from '../../packages/wdio-config/src/constants.js'
export const isCloudCapability = vi.fn().mockImplementation(isCloudCapabilityMock)
export const validateConfig = vi.fn().mockImplementation((defaults, config) => {
    const returnVal = validateConfigMock(defaults, config)
    /**
     * in order to ensure that WebdriverIO unit tests default to use the webdriver
     * package we modify the default value here
     */
    if (!returnVal.hostname) {
        returnVal.hostname = 'localhost'
    }

    return returnVal
})
