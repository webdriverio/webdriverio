import { Status as RealStatus } from 'cucumber'

export const supportCodeLibraryBuilder = {
    reset: jest.fn(),
    finalize: jest.fn()
}

export const setDefaultTimeout = jest.fn()
export const setDefinitionFunctionWrapper = jest.fn()
export const getTestCasesFromFilesystem = jest.fn()
export const PickleFilter = jest.fn()
export const Runtime = jest.fn().mockImplementation(() => ({
    start: jest.fn().mockImplementation(() => true)
}))
export const Status = RealStatus
