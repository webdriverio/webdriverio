import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { WS_MESSAGE_TYPES } from '@wdio/types'
import type { ClientFunctions } from '@wdio/rpc'
import BrowserFramework from '../src/browser.js'
import { browser } from '@wdio/globals'
import type BaseReporter from '../src/reporter.js'
import type { Browser as BrowserObject } from 'webdriverio'
import WDIORunner from '../src/index.js'
import * as rpcModule from '@wdio/rpc'

const mockRpc = {
    errorMessage: vi.fn(),
    workerResponse: vi.fn()
}

let capturedClientHandlers: Partial<ClientFunctions> | undefined

vi.mock('@wdio/logger', () => {
    const logMock = {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
    return {
        default: vi.fn(() => logMock)
    }
})

vi.mock('@wdio/globals', () => ({
    browser: {
        url: vi.fn(),
        setCookies: vi.fn(),
        execute: vi.fn(),
        getLogs: vi.fn()
    } as unknown as BrowserObject
}))

vi.mock('node:url', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await vi.importActual('node:url') as typeof import('node:url')
    return {
        ...actual,
        fileURLToPath: vi.fn(() => 'file:///fake/spec1.js')
    }
})

process.send = vi.fn()

const mockReporter: BaseReporter = {
    emit: vi.fn()
} as unknown as BaseReporter

const mockConfig = {
    mochaOpts: { timeout: 100 },
    runner: [],
    sessionId: 'abc-session'
}

describe('BrowserFramework', () => {
    let framework: BrowserFramework

    beforeEach(() => {
        vi.clearAllMocks()
        capturedClientHandlers = undefined
        vi.spyOn(rpcModule, 'createClientRpc').mockImplementation((_transport: any, handlers: any) => {
            // only capture the browser-runner client handlers (skip the empty runner client)
            if (handlers && handlers.workerRequest) {
                capturedClientHandlers = handlers
            }
            return mockRpc as any
        })
        ;(browser.setCookies as Mock).mockResolvedValue(undefined)
        framework = new BrowserFramework('cid123', mockConfig as any, ['spec1.js'], mockReporter)
    })

    it('should send errorMessage when browser.url fails', async () => {
        (browser.url as any).mockRejectedValue(new Error('some failure'))
        const exitCode = await framework.run()

        expect(exitCode).toBe(1)
        expect(mockRpc.errorMessage).toHaveBeenCalledWith(expect.objectContaining({
            origin: 'worker',
            name: 'error',
            content: expect.objectContaining({
                message: 'Invalid URL',
                name: 'TypeError',
                stack: expect.stringContaining('TypeError: Invalid URL')
            })
        }))
    })

    it('hasTests should return true', () => {
        expect(framework.hasTests()).toBe(true)
    })

    it('should return 0 when spec passes and session is reused', async () => {
        const hook = vi.fn()
        const runner = new WDIORunner()
        runner['_shutdown'] = vi.fn()
        runner['_browser'] = {
            deleteSession: vi.fn(),
            sessionId: '123',
            config: { afterSession: [hook] }
        } as unknown as BrowserObject
        runner['_config'] = { logLevel: 'info', afterSession: [hook] } as any

        await runner.run({ args: {}, configFile: '/foo/bar' } as any)

        expect(browser.url).not.toHaveBeenCalled()
        expect(mockRpc.errorMessage).not.toHaveBeenCalledWith(expect.anything())
    })

    describe('workerRequest dispatch', () => {
        it('answers an expectMatchersRequest with the list of available matchers', () => {
            capturedClientHandlers!.workerRequest!({
                id: 5,
                message: { type: WS_MESSAGE_TYPES.expectMatchersRequest, value: {} }
            } as any)

            expect(mockRpc.workerResponse).toHaveBeenCalledTimes(1)
            const arg = mockRpc.workerResponse.mock.calls[0][0]
            expect(arg.args.id).toBe(5)
            expect(arg.args.message.type).toBe(WS_MESSAGE_TYPES.expectMatchersResponse)
            expect(Array.isArray(arg.args.message.value.matchers)).toBe(true)
        })

        it('dispatches a command request and keeps the communicator id separate from the payload id', async () => {
            await capturedClientHandlers!.workerRequest!({
                id: 42,
                message: {
                    type: WS_MESSAGE_TYPES.commandRequestMessage,
                    value: { id: 7, cid: 'cid123', commandName: 'notARealCommand', args: [] }
                }
            } as any)

            expect(mockRpc.workerResponse).toHaveBeenCalledTimes(1)
            const arg = mockRpc.workerResponse.mock.calls[0][0]
            // communicator-level correlation id
            expect(arg.args.id).toBe(42)
            expect(arg.args.message.type).toBe(WS_MESSAGE_TYPES.commandResponseMessage)
            // browser payload id is preserved within the response value
            expect(arg.args.message.value.id).toBe(7)
        })

        it('dispatches a hook trigger and returns a hook result', async () => {
            await capturedClientHandlers!.workerRequest!({
                id: 3,
                message: {
                    type: WS_MESSAGE_TYPES.hookTriggerMessage,
                    value: { id: 1, cid: 'cid123', name: 'beforeTest', args: [] }
                }
            } as any)

            expect(mockRpc.workerResponse).toHaveBeenCalledTimes(1)
            const arg = mockRpc.workerResponse.mock.calls[0][0]
            expect(arg.args.id).toBe(3)
            expect(arg.args.message.type).toBe(WS_MESSAGE_TYPES.hookResultMessage)
            expect(arg.args.message.value.id).toBe(1)
        })

        it('warns on an unknown worker request type', () => {
            capturedClientHandlers!.workerRequest!({
                id: 1,
                message: { type: -1, value: {} }
            } as any)
            expect(mockRpc.workerResponse).not.toHaveBeenCalled()
        })
    })
})
