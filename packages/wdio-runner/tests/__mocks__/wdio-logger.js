export default () => logMock
export const logMock = {
    error: jest.fn(),
    debug: jest.fn()
}
