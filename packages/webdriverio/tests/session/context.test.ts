import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
    getContextManager,
    getParallelContextStore,
    setParallelContextStore,
    registerParallelContext,
    unregisterParallelContext,
    isParallelContext,
    PARALLEL_CONTEXTS_KEY,
    PARALLEL_SAFE_CLASSIC_COMMANDS,
} from '../../src/session/context.js'
import { withScreenshotEvents } from '../../src/utils/screenshotEvents.js'
import { logMock } from '@wdio/logger'
import { WebDriverProtocol } from '@wdio/protocols'
import { SESSION_ENDED_ERROR } from 'webdriver'

setParallelContextStore(new AsyncLocalStorage<string>())

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type ListenerMap = Record<string, Array<(arg: any) => any>>

/**
 * the error that `webdriver` gives a command when the session or its connection ended
 */
const sessionEnded = (message: string) => Object.assign(new Error(message), { name: SESSION_ENDED_ERROR })

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
        switchToWindow: vi.fn().mockResolvedValue(undefined),
        sessionSubscribe: vi.fn().mockResolvedValue(undefined),
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
        vi.mocked(logMock.debug).mockClear()
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

    it('switches to the top-level context when a nested child frame is destroyed and child nodes omit parent', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).browsingContextGetTree.mockResolvedValue({
            contexts: [{
                context: 'other-window', parent: null, children: [], url: '',
                clientWindow: 'window-2', originalOpener: null, userContext: 'default'
            }, {
                context: 'context-1', parent: null, url: '', clientWindow: 'window-1',
                originalOpener: null, userContext: 'default',
                children: [{
                    context: 'frame-parent', url: '', clientWindow: 'window-1',
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

    it('does not reject when the connection closes while a navigation event is handled', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        /**
         * the session ends while the tree is requested: the pending command is rejected
         */
        ;(browser as any).browsingContextGetTree.mockRejectedValue(sessionEnded(
            'WebDriver Bidi command "browsingContext.getTree" with id 13 got no result: the connection was closed'
        ))
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const navigationHandlers = stub.getListeners()['browsingContext.navigationStarted']
        await expect(navigationHandlers![0]({ context: 'iframe-1', navigation: null, timestamp: 0, url: '' })).resolves.toBeUndefined()
        expect(logMock.debug).toHaveBeenCalledWith(expect.stringContaining('the session ended: WebDriver Bidi command'))
        expect(logMock.warn).not.toHaveBeenCalled()
    })

    it('does not reject when the connection closes while switchToParentFrame is handled', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).browsingContextGetTree.mockRejectedValue(sessionEnded(
            'WebDriver Bidi command "browsingContext.getTree" with id 13 got no result: the connection was closed'
        ))
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('frame-1')

        const commandHandlers = stub.getListeners().command
        await expect(commandHandlers![commandHandlers!.length - 1]({ command: 'switchToParentFrame', body: {} })).resolves.toBeUndefined()
        expect(logMock.debug).toHaveBeenCalledWith(expect.stringContaining('the session ended: WebDriver Bidi command'))
        expect(logMock.warn).not.toHaveBeenCalled()
    })

    it('warns when a navigation event cannot update the context for another reason', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        ;(stub.browser as any).browsingContextGetTree.mockRejectedValue(new Error('unknown error: the tree is not available'))
        const manager = getContextManager(stub.browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const navigationHandlers = stub.getListeners()['browsingContext.navigationStarted']
        await expect(navigationHandlers![0]({ context: 'iframe-1', navigation: null, timestamp: 0, url: '' })).resolves.toBeUndefined()
        expect(logMock.warn).toHaveBeenCalledWith(expect.stringContaining('unknown error: the tree is not available'))
    })

    it('does not reject when the session ends while the navigation events are subscribed', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const unhandled: unknown[] = []
        const onUnhandled = (reason: unknown) => { unhandled.push(reason) }
        process.on('unhandledRejection', onUnhandled)
        try {
            const stub = createBrowserStub({ isBidi: true } as any)
            ;(stub.browser as any).sessionSubscribe.mockRejectedValue(sessionEnded(
                'WebDriver Bidi command "session.subscribe" with id 3 got no result: the connection was closed'
            ))
            getContextManager(stub.browser)
            await new Promise((resolve) => setTimeout(resolve, 10))
            expect(unhandled).toEqual([])
            expect(logMock.debug).toHaveBeenCalledWith(expect.stringContaining('the session ended: WebDriver Bidi command "session.subscribe"'))
        } finally {
            process.off('unhandledRejection', onUnhandled)
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    it('makes closeWindow wait for the switch to the remaining window', async () => {
        let switched!: () => void
        browser.switchToWindow.mockReturnValue(new Promise<void>((resolve) => { switched = resolve }))
        const waitUntil = vi.fn()

        getListeners().result![0]({ command: 'closeWindow', result: { value: ['handle-A'] }, waitUntil })

        expect(browser.switchToWindow).toHaveBeenCalledWith('handle-A')
        expect(waitUntil).toHaveBeenCalledTimes(1)
        let done = false
        void waitUntil.mock.calls[0][0].then(() => { done = true })
        await Promise.resolve()
        expect(done).toBe(false)
        switched()
        await waitUntil.mock.calls[0][0]
        expect(done).toBe(true)
    })

    it('does not reject when the session ends while it switches to a window after closeWindow', async () => {
        const stub = createBrowserStub()
        stub.browser.switchToWindow.mockRejectedValue(sessionEnded(
            'Trying to run command "switchToWindow("handle-A")" after session has been deleted, aborting request without executing it'
        ))
        getContextManager(stub.browser)
        const resultHandlers = stub.getListeners().result

        await expect(resultHandlers![0]({ command: 'closeWindow', result: { value: ['handle-A'] } })).resolves.toBeUndefined()
        expect(logMock.debug).toHaveBeenCalledWith(expect.stringContaining('the session ended: Trying to run command'))
    })

    /**
     * after closeWindow and deleteSession, a destroyed context switches to a window with a
     * WebDriver Classic request to a driver that is already stopped: its error has no
     * session end message, but the WebDriver BiDi connection is closed
     */
    const destroyedWithClosedDriver = async (bidiHandler: { isConnected: boolean, isClosed: boolean }) => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true, _bidiHandler: bidiHandler } as any)
        ;(stub.browser as any).getWindowHandles.mockResolvedValue(['handle-B'])
        stub.browser.switchToWindow.mockRejectedValue(new Error(
            'WebDriverError: Request failed with error code UND_ERR_CLOSED when running "window" with method "POST"'
        ))
        const manager = getContextManager(stub.browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')
        await stub.getListeners()['browsingContext.contextDestroyed']![0]({ context: 'context-1' })
    }

    it('logs at debug level when a destroyed context cannot switch because the connection closed', async () => {
        await destroyedWithClosedDriver({ isConnected: false, isClosed: true })
        expect(logMock.debug).toHaveBeenCalledWith(expect.stringContaining('the session ended: WebDriverError: Request failed with error code UND_ERR_CLOSED'))
        expect(logMock.warn).not.toHaveBeenCalled()
    })

    it('warns when a destroyed context cannot switch while the connection is open', async () => {
        await destroyedWithClosedDriver({ isConnected: true, isClosed: false })
        expect(logMock.warn).toHaveBeenCalledWith(expect.stringContaining('UND_ERR_CLOSED'))
    })

    /**
     * a session whose WebDriver BiDi connection could not be made goes on with WebDriver
     * Classic: its errors are real errors, not a session end
     */
    it('warns when a destroyed context cannot switch and the connection was never made', async () => {
        await destroyedWithClosedDriver({ isConnected: false, isClosed: false })
        expect(logMock.warn).toHaveBeenCalledWith(expect.stringContaining('UND_ERR_CLOSED'))
        expect(logMock.debug).not.toHaveBeenCalledWith(expect.stringContaining('the session ended'))
    })

    it('drops a cached context that switchToParentFrame cannot find a parent for', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        /**
         * the cached frame was destroyed by the page, so it is not in the tree
         * any more and has no parent to step up to
         */
        ;(browser as any).browsingContextGetTree.mockResolvedValue({
            contexts: [{
                context: 'context-1', parent: null, children: [],
                url: '', clientWindow: 'window-1', originalOpener: null, userContext: 'default'
            }]
        })
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('destroyed-frame')

        /**
         * the base SessionManager registers a 'command' listener of its own first,
         * so the ContextManager's is the last one
         */
        const commandHandlers = stub.getListeners().command
        await commandHandlers![commandHandlers!.length - 1]({ command: 'switchToParentFrame', body: {} })

        expect(manager.getCurrentWindowHandle()).toBeUndefined()
        /**
         * the dead id is gone, so the next call re-resolves the context
         * through `initialize()` instead of addressing a destroyed frame
         */
        expect(await manager.getCurrentContext()).not.toBe('destroyed-frame')
    })

    it('keeps a valid top-level context when switchToParentFrame finds no parent', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        /**
         * the cached context is top-level: it has no parent, but it is very much
         * still in the tree, so stepping up is a no-op rather than a recovery
         */
        ;(browser as any).browsingContextGetTree.mockResolvedValue({
            contexts: [{
                context: 'context-1', parent: null, children: [],
                url: '', clientWindow: 'window-1', originalOpener: null, userContext: 'default'
            }]
        })
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('context-1')

        const commandHandlers = stub.getListeners().command
        await commandHandlers![commandHandlers!.length - 1]({ command: 'switchToParentFrame', body: {} })

        expect(await manager.getCurrentContext()).toBe('context-1')
    })

    it('still switches to the parent frame when one exists', async () => {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).browsingContextGetTree.mockResolvedValue({
            contexts: [{
                context: 'context-1', parent: null,
                children: [{
                    context: 'frame-1', parent: 'context-1', children: [],
                    url: '', clientWindow: 'window-1', originalOpener: null, userContext: 'default'
                }],
                url: '', clientWindow: 'window-1', originalOpener: null, userContext: 'default'
            }]
        })
        const manager = getContextManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        manager.setCurrentContext('frame-1')

        /**
         * the base SessionManager registers a 'command' listener of its own first,
         * so the ContextManager's is the last one
         */
        const commandHandlers = stub.getListeners().command
        await commandHandlers![commandHandlers!.length - 1]({ command: 'switchToParentFrame', body: {} })

        expect(await manager.getCurrentContext()).toBe('context-1')
    })

    it('resolves the current frame to its top-level context', async () => {
        const stub = createBrowserStub({ isBidi: true } as any)
        const browser = stub.browser
        ;(browser as any).browsingContextGetTree.mockResolvedValue({
            contexts: [{
                context: 'top', parent: null, url: '', clientWindow: 'window-1',
                originalOpener: null, userContext: 'default',
                children: [{
                    context: 'frame', url: '', clientWindow: 'window-1',
                    originalOpener: null, userContext: 'default', children: []
                }]
            }]
        })
        const manager = getContextManager(browser)
        manager.setCurrentContext('frame')
        expect(await manager.getCurrentTopLevelContext()).toBe('top')

        manager.setCurrentContext('top')
        expect(await manager.getCurrentTopLevelContext()).toBe('top')
    })
})

/**
 * Android Chrome through Appium: the Appium context name (`CHROMIUM`) is not a
 * BiDi browsing context id. In a BiDi session the current context must be the
 * window handle, or BiDi commands fail with "no such frame - Context CHROMIUM not found".
 */
describe('ContextManager on mobile Android Chrome', () => {
    let wid: string | undefined

    beforeEach(() => {
        wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
    })

    afterEach(() => {
        process.env.WDIO_UNIT_TESTS = wid
    })

    function createAndroidChrome (isBidi: boolean) {
        const stub = createBrowserStub({
            isBidi,
            isMobile: true,
            isAndroid: true,
            capabilities: { platformName: 'Android', browserName: 'chrome' },
            getWindowHandle: vi.fn()
                .mockResolvedValueOnce('WINDOW-1')
                .mockResolvedValueOnce('WINDOW-2')
        } as any)
        const emit = async (event: string, payload: unknown) => {
            for (const handler of stub.getListeners()[event] || []) {
                await handler(payload)
            }
        }
        const switchAppiumContext = async (name: string) => {
            await emit('command', { command: 'switchAppiumContext', body: { name } })
            await emit('result', { command: 'switchAppiumContext', result: { value: null } })
        }
        return { ...stub, manager: getContextManager(stub.browser), emit, switchAppiumContext }
    }

    it('uses the window handle as the current context in a BiDi session', async () => {
        const { browser, manager } = createAndroidChrome(true)

        expect(await manager.getCurrentContext()).toBe('WINDOW-1')
        expect(manager.mobileContext).toBe('CHROMIUM')
        expect(manager.isNativeContext).toBe(false)
        expect(browser.getWindowHandle).toHaveBeenCalledTimes(1)
    })

    it('resolves the window handle again after switching to NATIVE_APP and back in a BiDi session', async () => {
        const { manager, switchAppiumContext } = createAndroidChrome(true)
        expect(await manager.getCurrentContext()).toBe('WINDOW-1')

        await switchAppiumContext('NATIVE_APP')
        expect(manager.mobileContext).toBe('NATIVE_APP')
        expect(manager.isNativeContext).toBe(true)

        await switchAppiumContext('CHROMIUM')
        expect(manager.mobileContext).toBe('CHROMIUM')
        expect(manager.isNativeContext).toBe(false)
        expect(await manager.getCurrentContext()).toBe('WINDOW-2')
    })

    it('keeps the current context when getAppiumContext returns the same context in a BiDi session', async () => {
        const { browser, manager, emit } = createAndroidChrome(true)
        expect(await manager.getCurrentContext()).toBe('WINDOW-1')

        await emit('result', { command: 'getAppiumContext', result: { value: 'CHROMIUM' } })

        expect(await manager.getCurrentContext()).toBe('WINDOW-1')
        expect(browser.getWindowHandle).toHaveBeenCalledTimes(1)
    })

    it('keeps the Appium context name when switchToWindow sets the current context in a BiDi session', async () => {
        const { manager, emit } = createAndroidChrome(true)

        await emit('command', { command: 'switchToWindow', body: { handle: 'WINDOW-9' } })

        expect(await manager.getCurrentContext()).toBe('WINDOW-9')
        expect(manager.mobileContext).toBe('CHROMIUM')
        expect(manager.isNativeContext).toBe(false)
    })

    it('keeps using the Appium context name in a Classic session', async () => {
        const { browser, manager, switchAppiumContext } = createAndroidChrome(false)

        expect(await manager.getCurrentContext()).toBe('CHROMIUM')
        expect(browser.getWindowHandle).not.toHaveBeenCalled()

        await switchAppiumContext('NATIVE_APP')
        expect(await manager.getCurrentContext()).toBe('NATIVE_APP')
        expect(manager.isNativeContext).toBe(true)
    })
})

describe('ContextManager — parallel mode guards', () => {
    let browser!: WebdriverIO.Browser & { on: any, off: any, switchToWindow: any }
    let getListeners!: () => ListenerMap

    beforeEach(() => {
        const stub = createBrowserStub()
        browser = stub.browser
        getListeners = stub.getListeners
        getContextManager(browser)
    })

    const parallelModeError = (command: string) =>
        `${command} is not supported in parallel mode — ` +
        "WebDriver Classic commands act on the session's focused window, which concurrent tests share"

    function createBidiBrowser() {
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const stub = createBrowserStub()
        const bidiBrowser = {
            ...stub.browser,
            isBidi: true,
        } as unknown as WebdriverIO.Browser & { on: any, off: any, switchToWindow: any }
        return { wid, stub, bidiBrowser }
    }

    it('throws when switchToWindow is issued inside a parallel test scope', () => {
        const { wid, stub, bidiBrowser } = createBidiBrowser()
        try {
            getContextManager(bidiBrowser)
            const commandHandlers = stub.getListeners().command
            const cmHandler = commandHandlers![commandHandlers!.length - 1]
            getParallelContextStore().run('ctx-parallel-a', () => {
                expect(() => cmHandler({ command: 'switchToWindow', endpoint: '/session/:sessionId/x', body: { handle: 'handle-A' } }))
                    .toThrow(parallelModeError('switchToWindow'))
            })
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    it('throws when switchToParentFrame or refresh is issued inside a parallel test scope', () => {
        const { wid, stub, bidiBrowser } = createBidiBrowser()
        try {
            getContextManager(bidiBrowser)
            const commandHandlers = stub.getListeners().command
            const cmHandler = commandHandlers![commandHandlers!.length - 1]
            getParallelContextStore().run('ctx-parallel-a', () => {
                expect(() => cmHandler({ command: 'switchToParentFrame', endpoint: '/session/:sessionId/x' }))
                    .toThrow(parallelModeError('switchToParentFrame'))
                expect(() => cmHandler({ command: 'refresh', endpoint: '/session/:sessionId/x' }))
                    .toThrow(parallelModeError('refresh'))
            })
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    it('throws when closeWindow is issued inside a parallel test scope', () => {
        const { wid, stub, bidiBrowser } = createBidiBrowser()
        try {
            getContextManager(bidiBrowser)
            const commandHandlers = stub.getListeners().command
            const cmHandler = commandHandlers![commandHandlers!.length - 1]
            getParallelContextStore().run('ctx-parallel-a', () => {
                expect(() => cmHandler({ command: 'closeWindow', endpoint: '/session/:sessionId/x', body: {} }))
                    .toThrow(parallelModeError('closeWindow'))
                expect(bidiBrowser.switchToWindow).not.toHaveBeenCalled()
            })
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    function getCommandHandler() {
        const { wid, stub, bidiBrowser } = createBidiBrowser()
        getContextManager(bidiBrowser)
        const commandHandlers = stub.getListeners().command
        return { wid, bidiBrowser, cmHandler: commandHandlers![commandHandlers!.length - 1] }
    }

    function inParallel(command: string) {
        const { wid, cmHandler } = getCommandHandler()
        try {
            expect(() => cmHandler({ command, endpoint: '/session/:sessionId/x', body: {} })).not.toThrow()
            return () => getParallelContextStore().run('ctx-parallel-a', () =>
                cmHandler({ command, endpoint: '/session/:sessionId/x', body: {} }))
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    }

    it('allows exactly the read-only safe commands', () => {
        expect(PARALLEL_SAFE_CLASSIC_COMMANDS).toEqual(['status', 'getTimeouts', 'getWindowHandles'])
        for (const command of PARALLEL_SAFE_CLASSIC_COMMANDS) {
            expect(inParallel(command), command).not.toThrow()
        }
    })

    const webDriverCommands = Object.values(WebDriverProtocol).flatMap((endpoint) =>
        Object.values(endpoint).map((method) => (method as { command: string }).command))

    it.each(webDriverCommands)('guards WebDriver command %s by the parallel allowlist', (command) => {
        if (PARALLEL_SAFE_CLASSIC_COMMANDS.includes(command)) {
            expect(inParallel(command)).not.toThrow()
        } else {
            expect(inParallel(command)).toThrow(command)
        }
    })

    it.each(['deleteSession', 'newSession', 'setTimeouts'])('%s throws the session-global message', (command) => {
        expect(inParallel(command)).toThrow(`${command} cannot run inside a parallel test`)
        expect(inParallel(command)).toThrow('Call it outside the test')
    })

    it.each(['acceptAlert', 'dismissAlert', 'getAlertText', 'sendAlertText'])('%s throws the alert message', (command) => {
        expect(inParallel(command)).toThrow(`${command} is not supported in parallel mode: alerts belong to a browsing context`)
    })

    it.each(['getElementComputedRole', 'getElementComputedLabel'])('%s throws the computed a11y message', (command) => {
        expect(inParallel(command)).toThrow('WebDriver BiDi has no command to read an element\'s computed role or label')
    })

    it.each(['getUrl', 'getLogs', 'chromiumFoo'])('%s with an endpoint throws the default message', (command) => {
        expect(inParallel(command)).toThrow(parallelModeError(command))
        expect(inParallel(command)).toThrow('please report it')
    })

    it('does not throw for a wrapper command event without an endpoint (BiDi override)', () => {
        const { wid, cmHandler } = getCommandHandler()
        try {
            getParallelContextStore().run('ctx-parallel-a', () => {
                expect(() => cmHandler({ command: 'getUrl', body: [] })).not.toThrow()
                expect(() => cmHandler({ command: 'getUrl', endpoint: '/session/:sessionId/url', body: {} }))
                    .toThrow(parallelModeError('getUrl'))
            })
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    it('does not throw for BiDi commands inside a parallel test scope', () => {
        const { wid, cmHandler } = getCommandHandler()
        try {
            getParallelContextStore().run('ctx-parallel-a', () => {
                expect(() => cmHandler({ command: 'browsingContextGetTree', body: {} })).not.toThrow()
            })
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    it('does not throw for the Classic screenshot events of a WebDriver BiDi capture', async () => {
        const { wid, cmHandler } = getCommandHandler()
        try {
            const emitter = { emit: (name: string, event: unknown) => name === 'command' && cmHandler(event) } as unknown as WebdriverIO.Browser
            await getParallelContextStore().run('ctx-parallel-a', async () => {
                await expect(withScreenshotEvents(emitter, 'takeScreenshot', () => Promise.resolve('data'))).resolves.toBe('data')
                await expect(withScreenshotEvents(emitter, 'takeElementScreenshot', () => Promise.resolve('data'), 'element-1'))
                    .resolves.toBe('data')
                expect(() => cmHandler({ command: 'takeScreenshot', method: 'GET', endpoint: '/session/:sessionId/screenshot', body: {} }))
                    .toThrow(parallelModeError('takeScreenshot'))
            })
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
    })

    it('works outside a parallel test scope', async () => {
        const { wid, stub, bidiBrowser } = createBidiBrowser()
        try {
            const manager = getContextManager(bidiBrowser)
            const commandHandlers = stub.getListeners().command
            const cmHandler = commandHandlers![commandHandlers!.length - 1]
            cmHandler({ command: 'switchToWindow', endpoint: '/session/:sessionId/x', body: { handle: 'handle-A' } })
            expect(await manager.getCurrentContext()).toBe('handle-A')
        } finally {
            process.env.WDIO_UNIT_TESTS = wid
        }
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
