import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createServerRpc } from '../src/index.js'
import { createBirpc } from 'birpc'

vi.mock('birpc', () => ({
    createBirpc: vi.fn()
}))

describe('createServerRpc', () => {
    const mockedCreateBirpc = vi.mocked(createBirpc)
    const mockSend = vi.fn()
    const mockOn = vi.fn()

    beforeEach(() => {
        vi.stubGlobal('process', {
            send: mockSend,
            on: mockOn
        } as unknown as NodeJS.Process)

        // Mock return value of createBirpc
        mockedCreateBirpc.mockReturnValue({
            // @ts-ignore
            post: vi.fn(),
            on: vi.fn(),
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    it('should call createBirpc with correct args', () => {
        const exposed = {
            someFn: vi.fn()
        }

        createServerRpc(exposed)

        expect(mockedCreateBirpc).toHaveBeenCalledTimes(1)

        const [exposedArg, handlers] = mockedCreateBirpc.mock.calls[0]

        expect(exposedArg).toEqual(exposed)
        expect(typeof handlers.post).toBe('function')
        expect(typeof handlers.on).toBe('function')
    })

    it('should call process.send in post', () => {
        const exposed = {}
        createServerRpc(exposed)
        const [, handlers] = mockedCreateBirpc.mock.calls[0]

        handlers.post('server message')
        expect(mockSend).toHaveBeenCalledWith('server message')
    })

    it('should register process.on in on', () => {
        const exposed = {}
        const fn = vi.fn()

        createServerRpc(exposed)
        const [, handlers] = mockedCreateBirpc.mock.calls[0]

        handlers.on(fn)
        expect(mockOn).toHaveBeenCalledWith('message', fn)
    })
})
