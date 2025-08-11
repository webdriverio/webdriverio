import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getContextManager } from '../../src/session/context.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type ListenerMap = Record<string, Array<(arg: any) => any>>

function createBrowserStub() {
    const listeners: ListenerMap = {}
    const browser = {
        sessionId: Math.random().toString(36).slice(2),
        isMobile: false,
        isBidi: false,
        capabilities: {},
        on: vi.fn((event: string, handler: (arg: any) => any) => {
            listeners[event] ||= []
            listeners[event].push(handler)
        }),
        off: vi.fn(),
        switchToWindow: vi.fn(),
        sessionSubscribe: vi.fn(),
        browsingContextGetTree: vi.fn()
    } as unknown as WebdriverIO.Browser & { on: any, off: any, switchToWindow: any }

    return {
        browser,
        getListeners: () => listeners
    }
}

describe('ContextManager', () => {
    let browser!: WebdriverIO.Browser & { on: any, off: any, switchToWindow: any }
    let getListeners!: () => ListenerMap

    beforeEach(() => {
        const stub = createBrowserStub()
        browser = stub.browser
        getListeners = stub.getListeners
        // instantiate to register listeners
        getContextManager(browser)
    })

    it('throws a clear error if closeWindow returns no window handles (value undefined)', () => {
        const resultHandlers = getListeners().result
        expect(resultHandlers?.length).toBeGreaterThan(0)
        const handler = resultHandlers![0]
        expect(() => handler({ command: 'closeWindow', result: {} })).toThrow(
            'All window handles were removed, causing WebdriverIO to close the session.'
        )
    })

    it('throws a clear error if closeWindow returns an empty window handles array', () => {
        const resultHandlers = getListeners().result
        const handler = resultHandlers![0]
        expect(() => handler({ command: 'closeWindow', result: { value: [] } })).toThrow(
            'All window handles were removed, causing WebdriverIO to close the session.'
        )
    })

    it('switches to the first remaining window handle when closing a window', () => {
        const resultHandlers = getListeners().result
        const handler = resultHandlers![0]
        handler({ command: 'closeWindow', result: { value: ['handle-A', 'handle-B'] } })
        expect(browser.switchToWindow).toHaveBeenCalledWith('handle-A')
    })

    it('rethrows a meaningful error if closeWindow result contains an error object', () => {
        const resultHandlers = getListeners().result
        const handler = resultHandlers![0]
        const error = new Error('All window handles were removed, causing WebdriverIO to close the session.')
        expect(() => handler({ command: 'closeWindow', result: { error } })).toThrow(
            'All window handles were removed, causing WebdriverIO to close the session.'
        )
        expect(browser.switchToWindow).not.toHaveBeenCalled()
    })
})
