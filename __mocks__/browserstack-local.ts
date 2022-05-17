import { vi } from 'vitest'

const Browserstack = {} as any

export const mockIsRunning = vi.fn().mockImplementation(() => true)
export const mockStart = vi.fn().mockImplementation((options, cb) => cb(null, null))
export const mockStop = vi.fn().mockImplementation((cb) => cb(null))

export const mockLocal = vi.fn().mockImplementation(function (this: any) {
    this.isRunning = mockIsRunning
    this.start = mockStart
    this.stop = mockStop
})

Browserstack.Local = class LocalMock {
    public isRunning = mockIsRunning
    public start = mockStart
    public stop = mockStop
}
module.exports = Browserstack
