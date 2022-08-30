import { vi } from 'vitest'

const mock = {} as any
mock.on = vi.fn().mockReturnValue(mock)
mock.append = vi.fn().mockReturnValue(mock)
mock.finalize = vi.fn().mockReturnValue(mock)

export default (...args: any[]) => {
    mock.args = args
    return mock
}
