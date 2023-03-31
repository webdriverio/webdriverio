import { vi } from 'vitest'
import { Status as RealStatus } from '@cucumber/cucumber'

export const supportCodeLibraryBuilder = {
    options: {
        beforeTestRunHookDefinitions: [],
        beforeTestCaseHookDefinitions: [],
        beforeTestStepHookDefinitions: [],
        afterTestStepHookDefinitions: [],
        afterTestCaseHookDefinitions: [],
        afterTestRunHookDefinitions: []
    },
    reset: vi.fn(),
    finalize: vi.fn()
}

export const parseGherkinMessageStream = vi.fn()
export const setDefaultTimeout = vi.fn()
export const setDefinitionFunctionWrapper = vi.fn()
export const getTestCasesFromFilesystem = vi.fn().mockImplementation(() => [])
export const PickleFilter = vi.fn()
export const Runtime = vi.fn().mockImplementation((opts) => ({
    start: vi.fn().mockImplementation(() => {
        if (opts.options.shouldFail) {
            return false
        }
        if (opts.options.shouldThrow) {
            return Promise.reject(new Error(opts.options.shouldThrow))
        }
        return true
    })
}))
export const Status = RealStatus as any

export const Before = vi.fn()
export const After = vi.fn()
export const BeforeStep = vi.fn()
export const AfterStep = vi.fn()
export const BeforeAll = vi.fn()
export const AfterAll = vi.fn()
