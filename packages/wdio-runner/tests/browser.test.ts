import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import BrowserFramework from '../src/browser.js'
import { browser } from '@wdio/globals'
import type BaseReporter from '../src/reporter.js'
import type { Browser as BrowserObject } from 'webdriverio'
import WDIORunner from '../src/index.js'
import * as rpcModule from '@wdio/rpc'

const mockRpc = {
    errorMessage: vi.fn()
}

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
        vi.spyOn(rpcModule, 'createClientRpc').mockReturnValue(mockRpc as any)
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
})
