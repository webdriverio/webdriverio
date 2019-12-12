class JasmineMock {
    constructor (...args) {
        this.args = args
        this.beforeAllHook = jest.fn()
        this.executeHook = jest.fn()
        this.jasmine = {
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
        this.env = {
            beforeAll: jest.fn(),
            beforeEach: jest.fn(),
            afterEach: jest.fn(),
            afterAll: jest.fn()
        }

        this.addSpecFiles = jest.fn()
        this.onComplete = jest.fn().mockImplementation((cb) => setTimeout(cb, 10))
        this.randomizeTests = jest.fn()
        this.execute = jest.fn()
    }
}

export default JasmineMock
