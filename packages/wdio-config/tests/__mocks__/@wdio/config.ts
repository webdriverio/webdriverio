import { DEFAULT_CONFIGS as DEFAULT_CONFIGS_IMPORT } from '../../../src/constants'
import {
    getSauceEndpoint as getSauceEndpointMock,
    isCloudCapability as isCloudCapabilityMock,
    detectBackend as detectBackendMock
} from '../../../src/utils'

class ConfigParserMock {
    addService = jest.fn()

    addConfigFile = jest.fn()

    merge = jest.fn()

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
export const getSauceEndpoint = jest.fn().mockImplementation(getSauceEndpointMock)
export const isCloudCapability = jest.fn().mockImplementation(isCloudCapabilityMock)
export const detectBackend = jest.fn().mockImplementation(detectBackendMock)
export const validateConfig = jest.fn().mockImplementation(
    (_, config) => Object.assign(
        DEFAULT_CONFIGS_IMPORT(),
        {
            hostname: 'localhost',
            port: 4444,
            protocol: 'http',
            path: '/',
            automationProtocol: 'webdriver'
        },
        config
    )
)
