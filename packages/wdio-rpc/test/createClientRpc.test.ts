import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClientRpc } from '../src/index.js'
import { createBirpc } from 'birpc'

vi.mock('birpc', () => ({
    createBirpc: vi.fn()
}))

describe('createClientRpc', () => {
    const mockedCreateBirpc = vi.mocked(createBirpc)
    const mockSend = vi.fn()
    const mockOn = vi.fn()

    beforeEach(() => {
        vi.stubGlobal('process', {
            send: mockSend,
            on: mockOn
        } as unknown as NodeJS.Process)

        // Default mock return for createBirpc
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

        createClientRpc(exposed)

        expect(mockedCreateBirpc).toHaveBeenCalledTimes(1)

        const [exposedArg, handlers] = mockedCreateBirpc.mock.calls[0]

        expect(exposedArg).toEqual(exposed)
        expect(typeof handlers.post).toBe('function')
        expect(typeof handlers.on).toBe('function')
    })

    it('should call process.send in post', () => {
        const exposed = {}
        const [_, handlers] = (() => {
            createClientRpc(exposed)
            return mockedCreateBirpc.mock.calls[0]
        })()

        handlers.post('test message')
        expect(mockSend).toHaveBeenCalledWith('test message')
    })

    it('should register process.on in on', () => {
        const exposed = {}
        const fn = vi.fn()

        const [_, handlers] = (() => {
            createClientRpc(exposed)
            return mockedCreateBirpc.mock.calls[0]
        })()

        handlers.on(fn)
        expect(mockOn).toHaveBeenCalledWith('message', fn)
    })
})
