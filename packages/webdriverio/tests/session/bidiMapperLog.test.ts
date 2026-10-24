/// <reference path="../../src/index.ts" />
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

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

const MAPPER = { targetId: 'mapper', type: 'other', url: 'about:blank' }

let browser: WebdriverIO.Browser & { sendCommandAndGetResult: Mock }

describe('BidiMapperLogManager', () => {
    beforeEach(() => {
        browser = {
            isChromium: true,
            isEnabled: vi.fn().mockReturnValue(true),
            sendCommandAndGetResult: vi.fn(async (cmd: string) => {
                if (cmd === 'Target.getTargets') {
                    return {
                        targetInfos: [
                            { targetId: 'page', type: 'page', url: 'about:blank' },
                            { targetId: 'ui', type: 'browser_ui', url: 'chrome://omnibox-popup.top-chrome/' },
                            MAPPER
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
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult.mock.calls).toEqual([
            // hidden targets are listed only with an explicit filter
            ['Target.getTargets', { filter: [{}] }],
            ['Target.attachToTarget', { targetId: 'mapper', flatten: false }],
            ['Target.sendMessageToTarget', {
                sessionId: 'mapper-session',
                message: JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: REMOVE_MAPPER_LOG } })
            }],
            ['Target.detachFromTarget', { sessionId: 'mapper-session' }]
        ])
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

    it('does nothing outside a WebDriver BiDi session', async () => {
        vi.mocked(browser.isEnabled as () => boolean).mockReturnValue(false)
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult).not.toBeCalled()
    })

    it('does nothing in a browser that is not Chromium', async () => {
        browser.isChromium = false
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult).not.toBeCalled()
    })

    it('does nothing when no target is the BiDi Mapper', async () => {
        browser.sendCommandAndGetResult.mockResolvedValueOnce({ targetInfos: [{ targetId: 'page', type: 'page', url: 'about:blank' }] })
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(true)
        expect(browser.sendCommandAndGetResult).toBeCalledTimes(1)
    })

    // a grid or a cloud service can block the ChromeDriver CDP endpoint
    it('does not fail the session when a CDP command fails', async () => {
        browser.sendCommandAndGetResult.mockRejectedValueOnce(new Error('unknown command'))
        expect(await new BidiMapperLogManager(browser).initialize()).toBe(false)
    })
})
