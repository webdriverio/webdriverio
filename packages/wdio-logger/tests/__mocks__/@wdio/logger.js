const mock = () => logMock
mock.setLevel = jest.fn()
mock.setLogLevelsConfig = jest.fn()
mock.waitForBuffer = jest.fn()
export const logMock = {
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    trace: jest.fn()
}

export default mock
