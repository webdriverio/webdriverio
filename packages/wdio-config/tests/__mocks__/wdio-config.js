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
    wrapCommand: (_, origFn) => origFn,
    ConfigParser: ConfigParserMock,
    runTestInFiberContext: jest.fn(),
    executeHooksWithArgs: jest.fn()
}
