const mock = () => logMock
mock.setLevel = jest.fn()
export const logMock = {
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
}

export default mock
