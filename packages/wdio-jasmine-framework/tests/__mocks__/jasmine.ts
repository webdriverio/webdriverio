export default class JasmineMock {
    args: any[]
    beforeAllHook = jest.fn()
    executeHook = jest.fn()
    jasmine = {
        addReporter: jest.fn(),
        specFilter: jest.fn(),
        configure: jest.fn(),
        getEnv: jest.fn().mockImplementation(() => this.jasmine),
        Spec: {
            prototype: {
                addExpectationResult: jest.fn(),
                execute: this.executeHook
            }
        },
        Suite: {
            prototype: {
                beforeAll: this.beforeAllHook
            }
        }
    }
    env = {
        beforeAll: jest.fn(),
        beforeEach: jest.fn(),
        afterEach: jest.fn(),
        afterAll: jest.fn()
    }

    addSpecFiles = jest.fn()
    onComplete = jest.fn().mockImplementation((cb) => setTimeout(cb, 10))
    randomizeTests = jest.fn()
    execute = jest.fn()

    constructor (...args) {
        this.args = args
    }
}
