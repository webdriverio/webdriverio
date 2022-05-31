import { vi } from 'vitest'
const logUpdateMock: any = vi.fn()
logUpdateMock.clear = vi.fn()

export default logUpdateMock
