import { Status as RealStatus } from '@cucumber/cucumber'

export const supportCodeLibraryBuilder = {
    options: {
        beforeTestRunHookDefinitions: [],
        beforeTestCaseHookDefinitions: [],
        afterTestCaseHookDefinitions: [],
        afterTestRunHookDefinitions: [],
    },
    reset: jest.fn(),
    finalize: jest.fn()
}

export const parseGherkinMessageStream = jest.fn()
export const setDefaultTimeout = jest.fn()
export const setDefinitionFunctionWrapper = jest.fn()
export const getTestCasesFromFilesystem = jest.fn().mockImplementation(() => [])
export const PickleFilter = jest.fn()
export const Runtime = jest.fn().mockImplementation((opts) => ({
    start: jest.fn().mockImplementation(() => {
        if (opts.options.shouldFail) {
            return false
        }
        if (opts.options.shouldThrow) {
            return Promise.reject(new Error(opts.options.shouldThrow))
        }
        return true
    })
}))
export const Status = RealStatus

export const Before = jest.fn()
export const After = jest.fn()
export const BeforeAll = jest.fn()
export const AfterAll = jest.fn()
