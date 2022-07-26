import { vi } from 'vitest'
import { Options } from '../../packages/wdio-types'

import { DEFAULT_CONFIGS as DEFAULT_CONFIGS_IMPORT } from '../../packages/wdio-config/src/constants'
import {
    isCloudCapability as isCloudCapabilityMock,
    validateConfig as validateConfigMock
} from '../../packages/wdio-config/src/utils'

class ConfigParserMock {
    addService = vi.fn()

    addConfigFile = vi.fn()

    merge = vi.fn()

    autoCompile = vi.fn()

    getConfig = vi.fn().mockReturnValue({
        runnerEnv: {},
        runner: 'local',
        outputDir: './tempDir'
    })

    getCapabilities = vi.fn().mockReturnValue([{
        browserName: 'chrome',
        specs: ['./tests/test2.js']
    }, {
        browserName: 'firefox'
    }])

    getSpecs = vi.fn().mockReturnValue(['./tests/test1.js'])
}

export const ConfigParser = ConfigParserMock
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
