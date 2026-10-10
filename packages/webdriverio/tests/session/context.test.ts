import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

describe('ContextManager on mobile', () => {
    let manager: ReturnType<typeof getContextManager>
    let commandHandler: (arg: any) => any
    let resultHandler: (arg: any) => any

    beforeEach(() => {
        const stub = createBrowserStub({ isMobile: true } as any)
        manager = getContextManager(stub.browser)
        const commandHandlers = stub.getListeners().command
        const resultHandlers = stub.getListeners().result
        commandHandler = commandHandlers![commandHandlers!.length - 1]
        resultHandler = resultHandlers![resultHandlers!.length - 1]
    })

    for (const setContextCommand of ['setAppiumContext', 'switchAppiumContext']) {
        it(`tracks ${setContextCommand} commands`, () => {
            commandHandler({ command: setContextCommand, body: { name: 'WEBVIEW_1' } })
            expect(manager.mobileContext).toBe('WEBVIEW_1')
        })

        it(`updates the current context from a successful ${setContextCommand} result`, async () => {
            commandHandler({ command: setContextCommand, body: { name: 'WEBVIEW_1' } })
            resultHandler({ command: setContextCommand, result: { value: null } })
            expect(await manager.getCurrentContext()).toBe('WEBVIEW_1')
        })
    }

    for (const getContextCommand of ['getCurrentAppiumContext', 'getAppiumContext']) {
        it(`updates the current context from ${getContextCommand} results`, async () => {
            resultHandler({ command: getContextCommand, result: { value: 'WEBVIEW_1' } })
            expect(await manager.getCurrentContext()).toBe('WEBVIEW_1')
        })

        it(`does not update the current context when a ${getContextCommand} result is undefined`, () => {
            const setCurrentContext = vi.spyOn(manager, 'setCurrentContext')
            resultHandler({ command: getContextCommand, result: { value: undefined } })
            expect(setCurrentContext).not.toHaveBeenCalled()
            setCurrentContext.mockRestore()
        })
    }
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
        const setAppiumContext = async (name: string) => {
            await emit('command', { command: 'setAppiumContext', body: { name } })
            await emit('result', { command: 'setAppiumContext', result: { value: null } })
        }
        return { ...stub, manager: getContextManager(stub.browser), emit, setAppiumContext }
    }

    it('uses the window handle as the current context in a BiDi session', async () => {
        const { browser, manager } = createAndroidChrome(true)

        expect(await manager.getCurrentContext()).toBe('WINDOW-1')
        expect(manager.mobileContext).toBe('CHROMIUM')
        expect(manager.isNativeContext).toBe(false)
        expect(browser.getWindowHandle).toHaveBeenCalledTimes(1)
    })

    it('resolves the window handle again after switching to NATIVE_APP and back in a BiDi session', async () => {
        const { manager, setAppiumContext } = createAndroidChrome(true)
        expect(await manager.getCurrentContext()).toBe('WINDOW-1')

        await setAppiumContext('NATIVE_APP')
        expect(manager.mobileContext).toBe('NATIVE_APP')
        expect(manager.isNativeContext).toBe(true)

        await setAppiumContext('CHROMIUM')
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
        const { browser, manager, setAppiumContext } = createAndroidChrome(false)

        expect(await manager.getCurrentContext()).toBe('CHROMIUM')
        expect(browser.getWindowHandle).not.toHaveBeenCalled()

        await setAppiumContext('NATIVE_APP')
        expect(await manager.getCurrentContext()).toBe('NATIVE_APP')
        expect(manager.isNativeContext).toBe(true)
    })
})
