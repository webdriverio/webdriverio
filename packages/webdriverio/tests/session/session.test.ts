import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionManager } from '../../src/session/session.js'
import { ContextManager } from '../../src/session/context.js'

describe('SessionManager', () => {
    const browser ={
        sessionId: '123',
        on: vi.fn(),
    } as unknown as WebdriverIO.Browser

    beforeEach(()=>{
        vi.mocked(browser.on).mockClear()
    })

    it('should listener registered', ()=>{
        new SessionManager(browser, 'dummy')
        expect(browser.on).toHaveBeenCalledTimes(1)
    })

    it('should listener registered only once when initialized multiple times', ()=>{
        browser.sessionId = '456'
        new SessionManager(browser, 'dummy')
        new SessionManager(browser, 'dummy')
        expect(browser.on).toHaveBeenCalledTimes(1)
    })

    it('should allow to remove event listeners', () => {
        const browser = {
            on: vi.fn(),
            off: vi.fn(),
            sessionId: '1234'
        } as any as WebdriverIO.Browser
        const sm = new SessionManager(browser, 'scope')
        const listener = vi.mocked(browser.on).mock.calls[0][1]
        sm.removeListeners()
        expect(browser.off).toBeCalledWith('command', listener)
    })

    it('should remove ContextManager listeners using the same references as they were registered', () => {
        const browser = {
            sessionId: '1234',
            capabilities: {},
            isBidi: false,
            isMobile: true,
            isAndroid: false,
            on: vi.fn(),
            off: vi.fn(),
            sessionSubscribe: vi.fn(),
            browsingContextGetTree: vi.fn(),
            switchToWindow: vi.fn(),
        } as any as WebdriverIO.Browser

        const cm = new ContextManager(browser)

        const onCalls = vi.mocked(browser.on).mock.calls
        const commandListeners = onCalls.filter(([event]) => event === 'command').map(([, listener]) => listener)
        const resultListeners = onCalls.filter(([event]) => event === 'result').map(([, listener]) => listener)
        const baseCommandListener = commandListeners[0]
        const contextCommandListener = commandListeners[1]

        expect(baseCommandListener).toBeTypeOf('function')
        expect(contextCommandListener).toBeTypeOf('function')
        expect(resultListeners).toHaveLength(2)
        expect(resultListeners[0]).toBeTypeOf('function')
        expect(resultListeners[1]).toBeTypeOf('function')

        cm.removeListeners()

        expect(browser.off).toHaveBeenCalledWith('command', baseCommandListener)
        expect(browser.off).toHaveBeenCalledWith('command', contextCommandListener)
        expect(browser.off).toHaveBeenCalledWith('result', resultListeners[0])
        expect(browser.off).toHaveBeenCalledWith('result', resultListeners[1])
    })
})
