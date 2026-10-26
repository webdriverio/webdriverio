/// <reference path="../../src/index.ts" />
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import logger from '@wdio/logger'

import { BidiMapperLogManager, REMOVE_MAPPER_LOG } from '../../src/session/bidiMapperLog.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../src/session/session.js', () => ({
    SessionManager: class SessionManagerMock {
        removeListeners = vi.fn()
        isEnabled: () => boolean
        constructor(public browser: { isEnabled: () => boolean }) {
            this.isEnabled = () => browser.isEnabled()
        }
    }
}))

const log = logger('test')

const PAGE = { targetId: 'page', type: 'page', url: 'about:blank', title: 'about:blank' }
// Chrome lists the hidden Mapper target and a tab entry for it with the same title
const MAPPER = { targetId: 'mapper', type: 'other', url: 'about:blank', title: 'BiDi-CDP Mapper' }
const MAPPER_TAB = { targetId: 'mapper-tab', type: 'tab', url: 'about:blank', title: 'BiDi-CDP Mapper' }

type CdpHandler = (method: string, params: Record<string, unknown>) => unknown

let browser: WebdriverIO.Browser & { _bidiHandler: { send: Mock } }

/**
 * answers `goog:cdp.sendCommand` as chromium-bidi does: the CDP result is in `result.result`
 */
function answer(handler: CdpHandler) {
    browser._bidiHandler.send.mockImplementation(async ({ method, params }: { method: string, params: { method: string, params: Record<string, unknown> } }) => {
        if (method !== 'goog:cdp.sendCommand') {
            throw new Error(`unexpected BiDi command ${method}`)
        }
        return { type: 'success', id: 1, result: { result: await handler(params.method, params.params) } }
    })
}

const defaultCdp: CdpHandler = (method) => {
    if (method === 'Target.getTargets') {
        return { targetInfos: [PAGE, { targetId: 'other', type: 'other', url: 'about:blank', title: 'about:blank' }, MAPPER, MAPPER_TAB] }
    }
    if (method === 'Target.attachToTarget') {
        return { sessionId: 'mapper-session' }
    }
    return {}
}

const cdpCalls = () => browser._bidiHandler.send.mock.calls.map(([{ params }]) => params)
const cdpMethods = () => cdpCalls().map(({ method }: { method: string }) => method)

describe('BidiMapperLogManager', () => {
    beforeEach(() => {
        vi.mocked(log.warn).mockClear()
        vi.mocked(log.debug).mockClear()
        vi.mocked(log.info).mockClear()
        browser = {
            isMobile: false,
            capabilities: { browserName: 'chrome', browserVersion: '156.0.8078.47', 'goog:chromeOptions': {} },
            options: { hostname: 'localhost', port: 4321 },
            isEnabled: vi.fn().mockReturnValue(true),
            _bidiHandler: { send: vi.fn() }
        } as unknown as WebdriverIO.Browser & { _bidiHandler: { send: Mock } }
        answer(defaultCdp)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('removes the log of the hidden BiDi Mapper target through the WebDriver BiDi connection', async () => {
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser._bidiHandler.send.mock.calls.map(([command]) => command)).toEqual([
            // hidden targets are listed only with an explicit filter
            { method: 'goog:cdp.sendCommand', params: { method: 'Target.getTargets', params: { filter: [{}] } } },
            { method: 'goog:cdp.sendCommand', params: { method: 'Target.attachToTarget', params: { targetId: 'mapper', flatten: false } } },
            { method: 'goog:cdp.sendCommand', params: {
                method: 'Target.sendMessageToTarget',
                params: {
                    sessionId: 'mapper-session',
                    message: JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: REMOVE_MAPPER_LOG } })
                }
            } },
            { method: 'goog:cdp.sendCommand', params: { method: 'Target.detachFromTarget', params: { sessionId: 'mapper-session' } } }
        ])
        expect(log.warn).not.toBeCalled()
    })

    // chrome-headless-shell gives the Mapper the type `page`
    it('removes the log of a BiDi Mapper of the type page', async () => {
        answer((method, params) => method === 'Target.getTargets'
            ? { targetInfos: [PAGE, { ...MAPPER, type: 'page' }] }
            : defaultCdp(method, params))
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpCalls()).toContainEqual({ method: 'Target.attachToTarget', params: { targetId: 'mapper', flatten: false } })
    })

    it('does not attach to the tab entry of the BiDi Mapper or to another target', async () => {
        answer((method, params) => method === 'Target.getTargets'
            ? { targetInfos: [PAGE, MAPPER_TAB, { ...MAPPER, type: 'iframe' }] }
            : defaultCdp(method, params))
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpMethods()).toEqual(['Target.getTargets'])
        expect(log.warn).not.toBeCalled()
    })

    // the BiDi connection reaches the browser also through a grid or a cloud service
    it('also removes the log when the driver does not run on this machine', async () => {
        browser.options.hostname = 'grid.example.com'
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpMethods()).toContain('Target.sendMessageToTarget')
    })

    it('does nothing outside a WebDriver BiDi session', async () => {
        vi.mocked(browser.isEnabled as () => boolean).mockReturnValue(false)
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser._bidiHandler.send).not.toBeCalled()
    })

    it('does nothing in a browser that is not Chromium', async () => {
        browser.capabilities = { browserName: 'firefox', browserVersion: '158.0.1', 'moz:firefoxOptions': {} }
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser._bidiHandler.send).not.toBeCalled()
    })

    // `browser.isChromium` keeps the value of the first session after `reloadSession()` to another browser
    it('reads the browser from the capabilities of the current session', async () => {
        Object.assign(browser, { isChromium: false })
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpMethods()).toContain('Target.sendMessageToTarget')

        browser._bidiHandler.send.mockClear()
        Object.assign(browser, { isChromium: true })
        browser.capabilities = { browserName: 'firefox', browserVersion: '158.0.1', 'moz:firefoxOptions': {} }
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser._bidiHandler.send).not.toBeCalled()
    })

    it('removes the log in Edge', async () => {
        browser.capabilities = { browserName: 'MicrosoftEdge', browserVersion: '156.0.4314.42', 'ms:edgeOptions': {} }
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpMethods()).toContain('Target.sendMessageToTarget')
    })

    // the Mapper is a page with a viewport before Chrome 137, and Chrome 132 has no `goog:cdp`
    it('does nothing before Chrome 137', async () => {
        browser.capabilities.browserVersion = '136.0.7103.113'
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser._bidiHandler.send).not.toBeCalled()
        expect(log.warn).not.toBeCalled()
    })

    it('removes the log from Chrome 137 and when the browser version is not known', async () => {
        browser.capabilities.browserVersion = '137.0.7151.119'
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        delete browser.capabilities.browserVersion
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpMethods().filter((method: string) => method === 'Target.sendMessageToTarget')).toHaveLength(2)
    })

    it('keeps the log when WDIO_KEEP_BIDI_MAPPER_LOG is set', async () => {
        try {
            for (const value of ['1', 'true', 'TRUE']) {
                process.env.WDIO_KEEP_BIDI_MAPPER_LOG = value
                expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
            }
            expect(browser._bidiHandler.send).not.toBeCalled()
            expect(log.info).toBeCalledWith(expect.stringContaining('WDIO_KEEP_BIDI_MAPPER_LOG'))

            for (const value of ['0', 'false', '']) {
                process.env.WDIO_KEEP_BIDI_MAPPER_LOG = value
                expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
            }
            expect(cdpMethods().filter((method: string) => method === 'Target.sendMessageToTarget')).toHaveLength(3)
        } finally {
            delete process.env.WDIO_KEEP_BIDI_MAPPER_LOG
        }
    })

    it('does nothing in a mobile session', async () => {
        browser.isMobile = true
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser._bidiHandler.send).not.toBeCalled()
    })

    // for example when Chrome fixed the issue and has no Mapper page
    it('does nothing and logs no warning when no target is the BiDi Mapper', async () => {
        answer((method, params) => method === 'Target.getTargets' ? { targetInfos: [PAGE] } : defaultCdp(method, params))
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpMethods()).toEqual(['Target.getTargets'])
        expect(log.warn).not.toBeCalled()
    })

    // an older chromium-bidi, or a grid or cloud service that blocks the command
    it('logs a warning with the reason and the effect when the CDP command is not known', async () => {
        browser._bidiHandler.send.mockRejectedValue(new Error('WebDriver Bidi command "goog:cdp.sendCommand" failed with error: unknown command'))
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(false)
        expect(cdpMethods()).toEqual(['Target.getTargets'])
        expect(log.warn).toBeCalledTimes(1)
        const [message] = vi.mocked(log.warn).mock.calls[0]
        expect(message).toContain('unknown command')
        expect(message).toContain('slower')
        expect(message).toContain('https://issues.chromium.org/issues/577213792')
    })

    it('detaches from the BiDi Mapper when the script cannot be sent', async () => {
        answer((method, params) => {
            if (method === 'Target.sendMessageToTarget') {
                throw new Error('no session')
            }
            return defaultCdp(method, params)
        })
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(false)
        expect(cdpCalls().at(-1)).toEqual({ method: 'Target.detachFromTarget', params: { sessionId: 'mapper-session' } })
        expect(log.warn).toBeCalledTimes(1)
    })

    // the log is already gone when only the detach fails
    it('does not warn when only the detach fails', async () => {
        answer((method, params) => {
            if (method === 'Target.detachFromTarget') {
                throw new Error('no session to detach')
            }
            return defaultCdp(method, params)
        })
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(log.warn).not.toBeCalled()
        expect(log.debug).toBeCalledWith(expect.stringContaining('no session to detach'))
    })

    it('still removes the log of a second Mapper target after a failure on the first one', async () => {
        answer((method, params) => {
            if (method === 'Target.getTargets') {
                return { targetInfos: [MAPPER, { ...MAPPER, targetId: 'mapper-2' }] }
            }
            if (method === 'Target.attachToTarget' && params.targetId === 'mapper') {
                throw new Error('no target')
            }
            return defaultCdp(method, params)
        })
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(false)
        expect(cdpCalls()).toContainEqual({ method: 'Target.attachToTarget', params: { targetId: 'mapper-2', flatten: false } })
        expect(cdpMethods()).toContain('Target.sendMessageToTarget')
        expect(vi.mocked(log.warn).mock.calls[0][0]).toContain('no target')
    })

    it('sends no new command after the 5 seconds limit', async () => {
        vi.useFakeTimers()
        answer(async (method, params) => {
            if (method === 'Target.getTargets') {
                await new Promise((resolve) => setTimeout(resolve, 6000))
            }
            return defaultCdp(method, params)
        })
        const initialized = new BidiMapperLogManager(browser).initialize()
        await vi.advanceTimersByTimeAsync(5000)
        expect(await initialized).toBe(false)
        await vi.advanceTimersByTimeAsync(2000)
        expect(cdpMethods()).toEqual(['Target.getTargets'])
    })

    it('still detaches when the limit comes after the attach', async () => {
        vi.useFakeTimers()
        answer(async (method, params) => {
            if (method === 'Target.attachToTarget') {
                await new Promise((resolve) => setTimeout(resolve, 6000))
            }
            return defaultCdp(method, params)
        })
        const initialized = new BidiMapperLogManager(browser).initialize()
        await vi.advanceTimersByTimeAsync(5000)
        expect(await initialized).toBe(false)
        await vi.advanceTimersByTimeAsync(2000)
        expect(cdpMethods()).toEqual(['Target.getTargets', 'Target.attachToTarget', 'Target.detachFromTarget'])
    })

    it('stops waiting after 5 seconds when the browser does not answer, and ignores a late error', async () => {
        vi.useFakeTimers()
        let rejectLate: (err: Error) => void = () => {}
        browser._bidiHandler.send.mockReturnValue(new Promise((_, reject) => {
            rejectLate = reject
        }))
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)
        try {
            const initialized = new BidiMapperLogManager(browser).initialize()
            await vi.advanceTimersByTimeAsync(4999)
            expect(log.warn).not.toBeCalled()
            await vi.advanceTimersByTimeAsync(1)
            expect(await initialized).toBe(false)
            expect(vi.mocked(log.warn).mock.calls[0][0]).toContain('5000ms')

            vi.useRealTimers()
            rejectLate(new Error('session ended'))
            await new Promise((resolve) => setTimeout(resolve, 10))
            expect(unhandled).not.toBeCalled()
            expect(log.warn).toBeCalledTimes(1)
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    // the fix runs in the browser of each session, a failure says nothing about the next one
    it('tries again in the next session after a failure', async () => {
        browser._bidiHandler.send.mockRejectedValueOnce(new Error('unknown command'))
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(false)
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(cdpMethods()).toContain('Target.sendMessageToTarget')
    })

    it('changes only the page of the BiDi Mapper', () => {
        const run = (title: string) => {
            const logs = { remove: vi.fn() }
            const document = { title, getElementById: (id: string) => id === 'logs' ? logs : null }
            new Function('document', REMOVE_MAPPER_LOG)(document)
            return logs.remove
        }
        expect(run('BiDi-CDP Mapper')).toBeCalledTimes(1)
        expect(run('another page')).not.toBeCalled()
    })
})
