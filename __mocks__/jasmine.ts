import { vi } from 'vitest'

export const beforeAllHook = vi.fn()
export const executeHook = vi.fn()
export const jasmine = {
    addReporter: vi.fn(),
    specFilter: vi.fn(),
    configure: vi.fn(),
    getEnv: vi.fn().mockImplementation(() => jasmine),
    Spec: {
        prototype: {
            addExpectationResult: vi.fn(),
            execute: executeHook
        }
    },
    Suite: {
        prototype: {
            beforeAll: beforeAllHook
        }
    },
    matchers: {
        toBe: vi.fn().mockReturnValue({
            compare: vi.fn(),
            negativeCompare: vi.fn()
        })
    },
    addMatchers: vi.fn(),
    addAsyncMatchers: vi.fn(),
    beforeAll: vi.fn((cb) => cb()),
    expectAsync: {
        any: vi.fn(),
        anything: vi.fn(),
        arrayContaining: vi.fn(),
        objectContaining: vi.fn(),
        stringContaining: vi.fn(),
        stringMatching: vi.fn(),
        not: vi.fn()
    }
}
export default class JasmineMock {
    args: unknown[]
    beforeAllHook = beforeAllHook
    executeHook = executeHook
    jasmine = jasmine
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

    constructor (...args: unknown[]) {
        this.args = args
    }
}
