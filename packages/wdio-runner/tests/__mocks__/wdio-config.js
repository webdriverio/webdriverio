class DotReporter {
    constructor (options) {
        this.options = options
        this.emit = jest.fn()
    }
}

const pluginMocks = {
    reporter: {
        dot: DotReporter
    }
}

export default {
    initialisePlugin: jest.fn().mockImplementation((name, type) => pluginMocks[type][name])
}
