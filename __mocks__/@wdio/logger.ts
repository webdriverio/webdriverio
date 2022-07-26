import { vi } from 'vitest'

export const logMock = {
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    trace: vi.fn()
}
const mock = () => logMock
mock.setLevel = vi.fn()
mock.setLogLevelsConfig = vi.fn()
mock.waitForBuffer = vi.fn()
export default mock
