import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
    getContextManager,
    registerParallelContext,
    unregisterParallelContext,
    isParallelContext,
    PARALLEL_CONTEXTS_KEY,
} from '../../src/session/context.js'

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

    it('should cache the current window handle on getWindowHandle command', () => {
        expect(getContextManager(browser).getCurrentWindowHandle()).toBeUndefined()
        const resultHandlers = getListeners().result
        const handler = resultHandlers![0]
        handler({ command: 'getWindowHandle', result: { value: 'current-window-handle' } })
        expect(getContextManager(browser).getCurrentWindowHandle()).toBe('current-window-handle')
    })

    it('should cache the current window handle on switchToWindow command success', () => {
        expect(getContextManager(browser).getCurrentWindowHandle()).toBeUndefined()
        const resultHandlers = getListeners().result
        const handler = resultHandlers![0]
        handler({ command: 'switchToWindow', result: { value: null }, body: { handle: 'current-window-handle' } })
        expect(getContextManager(browser).getCurrentWindowHandle()).toBe('current-window-handle')
    })

    it('should not cache the current window handle on switchToWindow command failure', () => {
        expect(getContextManager(browser).getCurrentWindowHandle()).toBeUndefined()
        const resultHandlers = getListeners().result
        const handler = resultHandlers![0]
        const error = new Error('no such window')
        handler({ command: 'switchToWindow', result: { error } })
        expect(getContextManager(browser).getCurrentWindowHandle()).toBeUndefined()
    })
})

describe('ContextManager — parallel context registry', () => {
    afterEach(() => {
        unregisterParallelContext('ctx-parallel-a')
        unregisterParallelContext('ctx-other')
    })

    it('registers, reports and unregisters parallel contexts', () => {
        expect(isParallelContext('ctx-parallel-a')).toBe(false)
        registerParallelContext('ctx-parallel-a')
        expect(isParallelContext('ctx-parallel-a')).toBe(true)
        unregisterParallelContext('ctx-parallel-a')
        expect(isParallelContext('ctx-parallel-a')).toBe(false)
    })

    it('exposes the registry on the browser instance for the framework adapters', () => {
        const stub = createBrowserStub()
        getContextManager(stub.browser)
        const registry = (stub.browser as unknown as Record<string, unknown>)[PARALLEL_CONTEXTS_KEY]
        expect(registry).toBeInstanceOf(Set)
        // The browser-exposed set IS the registry the manager consults — a
        // broken exposure (different Set) would silently disable the
        // re-anchor protection, so assert the wiring end-to-end.
        ;(registry as Set<string>).add('ctx-via-browser-prop')
        expect(isParallelContext('ctx-via-browser-prop')).toBe(true)
        unregisterParallelContext('ctx-via-browser-prop')
    })

    it('does not re-anchor the session context on navigations inside a parallel tab', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub()
        const bidiBrowser = {
            ...stub.browser,
            isBidi: true,
            browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [] }),
        } as unknown as WebdriverIO.Browser & { on: any, off: any, switchToWindow: any }
        try {
            const manager = getContextManager(bidiBrowser)
            manager.setCurrentContext('handle-A')
            registerParallelContext('ctx-parallel-a')

            const navHandlers = stub.getListeners()['browsingContext.navigationStarted']
            expect(navHandlers?.length).toBeGreaterThan(0)
            await navHandlers![0]({ context: 'ctx-parallel-a' })

            // parallel tab navigation: no tree fetch, no switchToWindow churn
            expect(bidiBrowser.browsingContextGetTree).not.toHaveBeenCalled()
            expect(bidiBrowser.switchToWindow).not.toHaveBeenCalled()
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    it('still re-anchors on navigations in non-parallel contexts (control)', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub()
        const bidiBrowser = {
            ...stub.browser,
            isBidi: true,
            browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [] }),
        } as unknown as WebdriverIO.Browser & { on: any, off: any, switchToWindow: any }
        try {
            const manager = getContextManager(bidiBrowser)
            manager.setCurrentContext('handle-A')

            const navHandlers = stub.getListeners()['browsingContext.navigationStarted']
            await navHandlers![0]({ context: 'ctx-other' })

            // unregistered context: existing re-anchor behavior preserved
            expect(bidiBrowser.browsingContextGetTree).toHaveBeenCalled()
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })
})
