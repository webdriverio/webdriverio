class DotReporter {
    constructor (options) {
        this.options = options
        this.emit = jest.fn()
    }
}

class RunnerMock {}
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
    },
    framework: {
        testNoFailures: {
            run() { return 0 }
        },
        testWithFailures: {
            run() { return 123 }
        },
        testThrows: {
            run() { throw new Error('framework testThrows failed') }
        }
    }
}

export const initialisePlugin = jest.fn().mockImplementation(
    (name, type) => pluginMocks[type][name])
export const initialiseServices = jest.fn().mockReturnValue([])
