import { vi } from 'vitest'
import type { Options } from '../../packages/wdio-types'

import { DEFAULT_CONFIGS as DEFAULT_CONFIGS_IMPORT } from '../../packages/wdio-config/src/constants.js'
import {
    isCloudCapability as isCloudCapabilityMock,
    validateConfig as validateConfigMock
} from '../../packages/wdio-config/src/utils.js'

export const DEFAULT_CONFIGS = DEFAULT_CONFIGS_IMPORT as () => Omit<Options.Testrunner, 'capabilities'>
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
