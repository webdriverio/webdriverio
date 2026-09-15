import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getContextManager } from '../../src/session/context.js'
import { logMock } from '@wdio/logger'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type ListenerMap = Record<string, Array<(arg: any) => any>>

function createBrowserStub(overrides: Partial<WebdriverIO.Browser> = {}) {
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
        browsingContextGetTree: vi.fn(),
        getWindowHandles: vi.fn(),
        getWindowHandle: vi.fn(),
        ...overrides
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
        vi.mocked(logMock.warn).mockClear()
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

    it('does not throw when closeWindow returns empty handles for a multiremote browser instance', () => {
        const { browser: mrBrowser, getListeners: getMrListeners } = createBrowserStub()
        mrBrowser.isMultiremoteBrowser = true
        getContextManager(mrBrowser)
        const handler = getMrListeners().result![0]
        expect(() => handler({ command: 'closeWindow', result: { value: [] } })).not.toThrow()
        expect(mrBrowser.switchToWindow).not.toHaveBeenCalled()
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

    it('registers a listener for browsingContext.contextDestroyed in bidi sessions', () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        getContextManager(stub.browser)
        process.env.WDIO_UNIT_TESTS = wid
        expect(stub.browser.sessionSubscribe).toHaveBeenCalledWith({
            events: ['browsingContext.navigationStarted', 'browsingContext.contextDestroyed']
        })
        expect(stub.getListeners()['browsingContext.contextDestroyed']?.length).toBeGreaterThan(0)
    })

    it('resets the current context and switches to a remaining window when the current context is destroyed', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).getWindowHandles.mockResolvedValue(['handle-B'])
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'context-1' })

        expect(browser.switchToWindow).toHaveBeenCalledWith('handle-B')
        expect(await manager.getCurrentContext()).toBe('handle-B')
        expect(manager.getCurrentWindowHandle()).toBeUndefined()
    })

    it('ignores contextDestroyed events for contexts that are not the current one', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'context-2' })

        expect(browser.switchToWindow).not.toHaveBeenCalled()
        expect(await manager.getCurrentContext()).toBe('context-1')
    })

    it('does not switch windows when no remaining window handles exist after the current context is destroyed', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).getWindowHandles.mockResolvedValue([])
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'context-1' })

        expect(browser.switchToWindow).not.toHaveBeenCalled()
    })

    it('switches to the parent context when a destroyed current context is a child frame (regression test)', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).browsingContextGetTree.mockResolvedValue({
            contexts: [{
                context: 'context-1', parent: null, children: null,
                url: '', clientWindow: 'window-1', originalOpener: null, userContext: 'default'
            }]
        })
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('frame-1')

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'frame-1', parent: 'context-1' })

        expect(browser.getWindowHandles).not.toHaveBeenCalled()
        expect(browser.switchToWindow).toHaveBeenCalledWith('context-1')
        expect(await manager.getCurrentContext()).toBe('context-1')
        expect(manager.getCurrentWindowHandle()).toBeUndefined()
    })

    it('switches to the top-level context when a nested child frame is destroyed (regression test)', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).browsingContextGetTree.mockResolvedValue({
            contexts: [{
                context: 'context-1', parent: null, url: '', clientWindow: 'window-1',
                originalOpener: null, userContext: 'default',
                children: [{
                    context: 'frame-parent', parent: 'context-1', url: '', clientWindow: 'window-1',
                    originalOpener: null, userContext: 'default', children: null
                }]
            }]
        })
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('frame-1')

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'frame-1', parent: 'frame-parent' })

        expect(browser.getWindowHandles).not.toHaveBeenCalled()
        expect(browser.switchToWindow).toHaveBeenCalledWith('context-1')
        expect(await manager.getCurrentContext()).toBe('context-1')
        expect(manager.getCurrentWindowHandle()).toBeUndefined()
    })

    it('does not overwrite a newer context transition that happened during recovery', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        // simulate a newer switchToWindow command transitioning the context
        // while the destroyed context recovery is resolving window handles
        const commandHandlers = stub.getListeners().command || []
        ;(browser as any).getWindowHandles.mockImplementation(async () => {
            for (const handler of commandHandlers) {
                handler({ command: 'switchToWindow', body: { handle: 'newer-handle' } })
            }
            return ['handle-B']
        })

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'context-1' })

        // recovery must not clobber the newer transition
        expect(browser.switchToWindow).not.toHaveBeenCalled()
        expect(await manager.getCurrentContext()).toBe('newer-handle')
    })

    it('does not overwrite a newer context transition that happens during the recovery switch', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const commandHandlers = stub.getListeners().command || []
        ;(browser as any).getWindowHandles.mockResolvedValue(['handle-B'])
        // a newer transition happens while the recovery switch is pending
        ;(browser as any).switchToWindow.mockImplementation(async () => {
            for (const handler of commandHandlers) {
                handler({ command: 'switchToWindow', body: { handle: 'newer-handle' } })
            }
        })

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'context-1' })

        expect(browser.switchToWindow).toHaveBeenCalledWith('handle-B')
        expect(await manager.getCurrentContext()).toBe('newer-handle')
    })

    it('does not clear a newer context transition when the recovery switch fails', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const commandHandlers = stub.getListeners().command || []
        ;(browser as any).getWindowHandles.mockResolvedValue(['handle-B'])
        // a newer transition happens while the recovery switch is pending and
        // the recovery switch then fails
        ;(browser as any).switchToWindow.mockImplementation(async () => {
            for (const handler of commandHandlers) {
                handler({ command: 'switchToWindow', body: { handle: 'newer-handle' } })
            }
            throw new Error('no such window')
        })

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await destroyedHandlers![0]({ context: 'context-1' })

        expect(vi.mocked(logMock.warn)).toHaveBeenCalledWith(
            expect.stringContaining('Failed to switch context after "context-1" was destroyed')
        )
        // the newer transition must not be erased by the failed recovery
        expect(await manager.getCurrentContext()).toBe('newer-handle')
    })

    it('logs a warning and does not throw if the recovery switch fails after the current context is destroyed', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).getWindowHandles.mockResolvedValue(['handle-B'])
        ;(browser as any).getWindowHandle.mockResolvedValue('reinitialized-handle')
        // simulate the production switchToWindow command, which fires a 'command'
        // event that caches the target handle before the switch resolves
        ;(browser as any).switchToWindow.mockImplementation(async (handle: string) => {
            browser.emit('command', { command: 'switchToWindow', body: { handle } })
            throw new Error('no such window')
        })
        const manager = getContextManager(browser)
        manager.setCurrentContext('context-1')

        const destroyedHandlers = stub.getListeners()['browsingContext.contextDestroyed']
        await expect(destroyedHandlers![0]({ context: 'context-1' })).resolves.toBeUndefined()

        expect(browser.switchToWindow).toHaveBeenCalledWith('handle-B')
        expect(vi.mocked(logMock.warn)).toHaveBeenCalledWith(
            expect.stringContaining('Failed to switch context after "context-1" was destroyed')
        )
        // the failed switch must not leave the cached context pointing at the
        // failed handle, so the next getCurrentContext() call re-initializes
        expect(await manager.getCurrentContext()).toBe('reinitialized-handle')
        expect(manager.getCurrentWindowHandle()).toBeUndefined()
        process.env.WDIO_UNIT_TESTS = wid
    })
})
