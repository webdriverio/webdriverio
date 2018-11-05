import { DEFAULT_CONFIGS } from '../../src/constants'

class DotReporter {
    constructor (options) {
        this.options = options
        this.emit = jest.fn()
    }
}

class ConfigParserMock {
    constructor () {
        this.addService = jest.fn()
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
    }
}

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
