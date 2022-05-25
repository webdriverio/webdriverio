import { vi } from 'vitest'
export default class ChromeProtocolMock {
    _runJsonCommand = vi.fn().mockResolvedValue([{ foo: 'bar' }])
    _connectToSocket = vi.fn()

    constructor (port: number, hostname: string) {
        expect(typeof port).toBe('string')
        expect(typeof hostname).toBe('string')
    }
}
