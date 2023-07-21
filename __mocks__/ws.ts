import { vi } from 'vitest'

export default class WebSocketMock {
    on = vi.fn().mockReturnValue({ off: vi.fn() })
    off = vi.fn()
    send = vi.fn()

    constructor (public wsUrl: string) {}
}
