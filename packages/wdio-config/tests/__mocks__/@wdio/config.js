import { DEFAULT_CONFIGS } from '../../../src/constants'
import { getSauceEndpoint as getSauceEndpointMock } from '../../../src/utils'

class DotReporter {
    constructor (options) {
        this.options = options
        this.emit = jest.fn()
    }
}

class RunnerMock {}

class ConfigParserMock {
    constructor () {
        this.addService = jest.fn()
        this.addConfigFile = jest.fn()
        this.merge = jest.fn()
        this.getConfig = jest.fn().mockReturnValue({
            runnerEnv: {},
            runner: 'local'
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

class FoobarServiceMock {
    beforeSuite () {}
    afterCommand () {}
}

const pluginMocks = {
    reporter: {
        dot: DotReporter
    },
    service: {
        foobar: FoobarServiceMock
    },
    runner: {
        local: RunnerMock
    }
}

export const getSauceEndpoint = getSauceEndpointMock
export const initialisePlugin = jest.fn().mockImplementation(
    (name, type) => pluginMocks[type][name])
export const validateConfig = jest.fn().mockImplementation(
    (_, config) => Object.assign(
        DEFAULT_CONFIGS,
        { hostname: '0.0.0.0', port: 4444, protocol: 'http', path: '/wd/hub' },
        config
    )
)
export const wrapCommand = (_, origFn) => origFn
export const ConfigParser = ConfigParserMock
export const runTestInFiberContext = jest.fn()
export const executeHooksWithArgs = jest.fn()
