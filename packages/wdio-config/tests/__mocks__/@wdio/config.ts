import { DEFAULT_CONFIGS as DEFAULT_CONFIGS_IMPORT } from '../../../src/constants'
import {
    isCloudCapability as isCloudCapabilityMock,
    validateConfig as validateConfigMock
} from '../../../src/utils'

class ConfigParserMock {
    addService = jest.fn()

    addConfigFile = jest.fn()

    merge = jest.fn()

    autoCompile = jest.fn()

    getConfig = jest.fn().mockReturnValue({
        runnerEnv: {},
        runner: 'local',
        outputDir: './tempDir'
    })

    getCapabilities = jest.fn().mockReturnValue([{
        browserName: 'chrome',
        specs: ['./tests/test2.js']
    }, {
        browserName: 'firefox'
    }])

    getSpecs = jest.fn().mockReturnValue(['./tests/test1.js'])
}

export const ConfigParser = ConfigParserMock
export const DEFAULT_CONFIGS = DEFAULT_CONFIGS_IMPORT
export const isCloudCapability = jest.fn().mockImplementation(isCloudCapabilityMock)
export const validateConfig = jest.fn().mockImplementation((defaults, config) => {
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
