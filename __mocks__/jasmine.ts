import { vi } from 'vitest'

export default class JasmineMock {
    args: any[]
    beforeAllHook = vi.fn()
    executeHook = vi.fn()
    jasmine = {
        addReporter: vi.fn(),
        specFilter: vi.fn(),
        configure: vi.fn(),
        getEnv: vi.fn().mockImplementation(() => this.jasmine),
        Spec: {
            prototype: {
                addExpectationResult: vi.fn(),
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
        beforeAll: vi.fn(),
        beforeEach: vi.fn(),
        afterEach: vi.fn(),
        afterAll: vi.fn()
    }

    addSpecFile = vi.fn()
    onComplete = vi.fn().mockImplementation((cb) => setTimeout(cb, 10))
    randomizeTests = vi.fn()
    execute = vi.fn()

    constructor (...args: any[]) {
        this.args = args
    }
}
