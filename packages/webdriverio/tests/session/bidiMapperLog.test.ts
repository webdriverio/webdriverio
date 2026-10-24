/// <reference path="../../src/index.ts" />
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

import type * as BidiMapperLog from '../../src/session/bidiMapperLog.js'

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

const PAGE = { targetId: 'page', type: 'page', url: 'about:blank', title: 'about:blank' }
// Chrome lists the hidden Mapper target and a tab entry for it with the same title
const MAPPER = { targetId: 'mapper', type: 'other', url: 'about:blank', title: 'BiDi-CDP Mapper' }
const MAPPER_TAB = { targetId: 'mapper-tab', type: 'tab', url: 'about:blank', title: 'BiDi-CDP Mapper' }

let browser: WebdriverIO.Browser & { sendCommandAndGetResult: Mock }
let manager: typeof BidiMapperLog

const calls = () => browser.sendCommandAndGetResult.mock.calls.map(([cmd]) => cmd)

describe('BidiMapperLogManager', () => {
    beforeEach(async () => {
        // the module keeps whether the CDP endpoint failed in this process
        vi.resetModules()
        manager = await import('../../src/session/bidiMapperLog.js')
        browser = {
            isChromium: true,
            isMobile: false,
            options: { hostname: 'localhost', port: 4321 },
            isEnabled: vi.fn().mockReturnValue(true),
            sendCommandAndGetResult: vi.fn(async (cmd: string) => {
                if (cmd === 'Target.getTargets') {
                    return {
                        targetInfos: [
                            PAGE,
                            { targetId: 'other', type: 'other', url: 'about:blank', title: 'about:blank' },
                            MAPPER,
                            MAPPER_TAB
                        ]
                    }
                }
                if (cmd === 'Target.attachToTarget') {
                    return { sessionId: 'mapper-session' }
                }
                return {}
            })
        } as unknown as WebdriverIO.Browser & { sendCommandAndGetResult: Mock }
    })

    it('removes the log of the hidden BiDi Mapper target', async () => {
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult.mock.calls).toEqual([
            // hidden targets are listed only with an explicit filter
            ['Target.getTargets', { filter: [{}] }],
            ['Target.attachToTarget', { targetId: 'mapper', flatten: false }],
            ['Target.sendMessageToTarget', {
                sessionId: 'mapper-session',
                message: JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: manager.REMOVE_MAPPER_LOG } })
            }],
            ['Target.detachFromTarget', { sessionId: 'mapper-session' }]
        ])
    })

    // chrome-headless-shell gives the Mapper the type `page`; ChromeDriver never answers that attach
    it('does not attach to a page target, also when it is titled as the BiDi Mapper', async () => {
        browser.sendCommandAndGetResult.mockResolvedValueOnce({ targetInfos: [PAGE, { ...MAPPER, type: 'page' }] })
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(calls()).toEqual(['Target.getTargets'])
    })

    // a grid, a cloud service or a proxy can block the CDP endpoint or never answer it
    it('does nothing when the driver does not run on this machine', async () => {
        browser.options.hostname = 'grid.example.com'
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult).not.toBeCalled()
    })

    it('does nothing in a mobile session', async () => {
        browser.isMobile = true
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult).not.toBeCalled()
    })

    it('changes only the page of the BiDi Mapper', () => {
        const run = (title: string) => {
            const logs = { remove: vi.fn() }
            const document = { title, getElementById: (id: string) => id === 'logs' ? logs : null }
            new Function('document', manager.REMOVE_MAPPER_LOG)(document)
            return logs.remove
        }
        expect(run('BiDi-CDP Mapper')).toBeCalledTimes(1)
        expect(run('another page')).not.toBeCalled()
    })

    it('does nothing outside a WebDriver BiDi session', async () => {
        vi.mocked(browser.isEnabled as () => boolean).mockReturnValue(false)
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult).not.toBeCalled()
    })

    it('does nothing in a browser that is not Chromium', async () => {
        browser.isChromium = false
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult).not.toBeCalled()
    })

    it('does nothing when no target is the BiDi Mapper', async () => {
        browser.sendCommandAndGetResult.mockResolvedValueOnce({ targetInfos: [PAGE] })
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(calls()).toEqual(['Target.getTargets'])
    })

    it('detaches from the BiDi Mapper when the script cannot be sent', async () => {
        browser.sendCommandAndGetResult.mockImplementation(async (cmd: string) => {
            if (cmd === 'Target.getTargets') {
                return { targetInfos: [MAPPER] }
            }
            if (cmd === 'Target.sendMessageToTarget') {
                throw new Error('no session')
            }
            return { sessionId: 'mapper-session' }
        })
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(false)
        expect(browser.sendCommandAndGetResult).toBeCalledWith('Target.detachFromTarget', { sessionId: 'mapper-session' })
    })

    // each failed request is retried
    it('does not use a CDP endpoint again after it failed once', async () => {
        browser.sendCommandAndGetResult.mockRejectedValueOnce(new Error('unknown command'))
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(false)
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(calls()).toEqual(['Target.getTargets'])
    })

    it('still uses the CDP endpoint of another driver after a failure', async () => {
        browser.sendCommandAndGetResult.mockRejectedValueOnce(new Error('unknown command'))
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(false)
        browser.options.port = 4444
        expect(await new manager.BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(calls()).toContain('Target.attachToTarget')
    })
})
