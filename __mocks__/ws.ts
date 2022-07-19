import { vi } from 'vitest'

export default class WebSocketMock {
    on = vi.fn()
}
