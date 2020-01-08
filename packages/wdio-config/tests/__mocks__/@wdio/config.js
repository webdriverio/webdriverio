import { DEFAULT_CONFIGS as DEFAULT_CONFIGS_IMPORT } from '../../../src/constants'
import { getSauceEndpoint as getSauceEndpointMock } from '../../../src/utils'

class ConfigParserMock {
    constructor () {
        this.addService = jest.fn()
        this.addConfigFile = jest.fn()
        this.merge = jest.fn()
        this.getConfig = jest.fn().mockReturnValue({
            runnerEnv: {},
            runner: 'local',
            outputDir: './tempDir'
        })
        this.getCapabilities = jest.fn().mockReturnValue([{
            browserName: 'chrome',
            specs: ['./tests/test2.js']
        }, {
            browserName: 'firefox'
        }])
        this.getSpecs = jest.fn().mockReturnValue(['./tests/test1.js'])
    }
}

export const DEFAULT_CONFIGS = DEFAULT_CONFIGS_IMPORT
export const getSauceEndpoint = getSauceEndpointMock
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
export const ConfigParser = ConfigParserMock
