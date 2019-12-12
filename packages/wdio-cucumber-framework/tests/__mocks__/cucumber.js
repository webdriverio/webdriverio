import { Status as RealStatus } from 'cucumber'

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

export const setDefaultTimeout = jest.fn()
export const setDefinitionFunctionWrapper = jest.fn()
export const getTestCasesFromFilesystem = jest.fn().mockImplementation(() => [])
export const PickleFilter = jest.fn()
export const Runtime = jest.fn().mockImplementation(() => ({
    start: jest.fn().mockImplementation(() => true)
}))
export const Status = RealStatus

export const Before = jest.fn()
export const After = jest.fn()
export const BeforeAll = jest.fn()
export const AfterAll = jest.fn()
