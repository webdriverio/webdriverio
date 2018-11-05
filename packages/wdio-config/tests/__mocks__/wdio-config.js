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

export default {
    initialisePlugin: jest.fn().mockImplementation((name, type) => pluginMocks[type][name]),
    validateConfig: jest.fn().mockImplementation(
        (_, config) => Object.assign(
            DEFAULT_CONFIGS,
            { hostname: '0.0.0.0', port: 4444, protocol: 'http', path: '/wd/hub' },
            config
        )
    ),
    wrapCommand: (_, origFn) => origFn,
    ConfigParser: ConfigParserMock,
    runTestInFiberContext: jest.fn(),
    executeHooksWithArgs: jest.fn()
}
