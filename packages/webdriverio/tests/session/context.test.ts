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

    describe('a switchToWindow that fails in a BiDi session', () => {
        const switchToWindow = { command: 'switchToWindow', body: { handle: 'closed-tab' } }
        const setup = () => {
            const wid = process.env.WDIO_UNIT_TESTS
            delete process.env.WDIO_UNIT_TESTS
            const stub = createBrowserStub({ isBidi: true } as any)
            const manager = getContextManager(stub.browser)
            process.env.WDIO_UNIT_TESTS = wid
            manager.setCurrentContext('context-1')
            const emit = (event: string, payload: unknown) => stub.getListeners()[event]!.forEach((handler) => handler(payload))
            return { manager, emit, browser: stub.browser }
        }

        it('keeps the context that the driver stays in', async () => {
            const { manager, emit } = setup()

            emit('command', switchToWindow)
            emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })

            expect(await manager.getCurrentContext()).toBe('context-1')
        })

        it('keeps the context of a switch that finished while it was in flight', async () => {
            const { manager, emit } = setup()
            // the switch to the first remaining window after closeWindow is not awaited
            const remaining = { command: 'switchToWindow', body: { handle: 'remaining-window' } }

            emit('command', remaining)
            emit('command', switchToWindow)
            emit('result', { ...remaining, result: { value: null } })
            emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })

            expect(await manager.getCurrentContext()).toBe('remaining-window')
        })

        it('keeps the context from before overlapping switches that both fail', async () => {
            const { manager, emit } = setup()
            // another switch that was not awaited
            const other = { command: 'switchToWindow', body: { handle: 'other-closed-tab' } }

            emit('command', other)
            emit('command', switchToWindow)
            emit('result', { ...other, result: { error: new Error('no such window') } })
            emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })

            expect(await manager.getCurrentContext()).toBe('context-1')
        })

        describe('with the results of overlapping switches in reverse order', () => {
            const other = { command: 'switchToWindow', body: { handle: 'other-window' } }

            it('uses the window of a switch that succeeds after a later one failed', async () => {
                const { manager, emit } = setup()

                emit('command', other)
                emit('command', switchToWindow)
                emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })
                // the other switch has no result yet, so its window is the context until then
                expect(await manager.getCurrentContext()).toBe('other-window')
                emit('result', { ...other, result: { value: null } })

                expect(await manager.getCurrentContext()).toBe('other-window')
            })

            it('keeps the context from before both switches when both fail', async () => {
                const { manager, emit } = setup()

                emit('command', other)
                emit('command', switchToWindow)
                emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })
                emit('result', { ...other, result: { error: new Error('no such window') } })

                expect(await manager.getCurrentContext()).toBe('context-1')
            })

            it('keeps the window of a later switch that succeeds before an earlier one', async () => {
                const { manager, emit } = setup()

                emit('command', switchToWindow)
                emit('command', other)
                emit('result', { ...other, result: { value: null } })
                // a command after the awaited switch, before the earlier switch has a result
                expect(await manager.getCurrentContext()).toBe('other-window')
                emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })

                expect(await manager.getCurrentContext()).toBe('other-window')
            })

            it('uses the window of an earlier switch that succeeds last, as the driver does', async () => {
                const { manager, emit } = setup()
                const first = { command: 'switchToWindow', body: { handle: 'first-window' } }

                emit('command', first)
                emit('command', other)
                emit('result', { ...other, result: { value: null } })
                expect(await manager.getCurrentContext()).toBe('other-window')
                emit('result', { ...first, result: { value: null } })

                expect(await manager.getCurrentContext()).toBe('first-window')
            })

            it('matches each result to its own request when a handle is pending twice', async () => {
                const { manager, emit } = setup()
                // as in `webdriver`, the command and the result event of a request share its body
                const first = { command: 'switchToWindow', body: { handle: 'first-window' } }
                const again = { command: 'switchToWindow', body: { handle: 'first-window' } }

                emit('command', first)
                emit('command', other)
                emit('command', again)
                emit('result', { ...again, result: { value: null } })
                emit('result', { ...other, result: { value: null } })
                // the switch to first-window without a result was sent before the one to other-window
                expect(await manager.getCurrentContext()).toBe('other-window')
                emit('result', { ...first, result: { value: null } })

                expect(await manager.getCurrentContext()).toBe('first-window')
            })
        })

        it('follows the request, not the event of a switchToWindow wrapper', async () => {
            const { manager, emit } = setup()
            // e.g. an overwritten `switchToWindow`: its event has the arguments as its body, and no handle
            const wrapper = { command: 'switchToWindow', body: ['closed-tab'] }

            emit('command', wrapper)
            emit('command', switchToWindow)
            emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })
            emit('result', { command: 'switchToWindow', result: { error: new Error('no such window') } })

            expect(await manager.getCurrentContext()).toBe('context-1')
        })

        it.each([
            ['the frame', { context: 'frame-1', parent: 'context-1', children: null }],
            ['the parent of the frame', { context: 'frame-parent', parent: 'context-1', children: [{ context: 'frame-1', children: [] }] }]
        ])('resolves the window again when %s is destroyed during the switch', async (_, destroyed) => {
            const { manager, emit, browser } = setup()
            ;(browser as any).getWindowHandle.mockResolvedValue('context-1')
            manager.setCurrentContext('frame-1')

            emit('command', switchToWindow)
            emit('browsingContext.contextDestroyed', destroyed)
            emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })

            // the frame from before the switch is gone, so the next command resolves the window the driver is in
            const wid = process.env.WDIO_UNIT_TESTS
            delete process.env.WDIO_UNIT_TESTS
            try {
                expect(await manager.getCurrentContext()).toBe('context-1')
                expect(browser.getWindowHandle).toHaveBeenCalled()
            } finally {
                process.env.WDIO_UNIT_TESTS = wid
            }
        })

        it('keeps a newer context transition', async () => {
            const { manager, emit } = setup()

            emit('command', switchToWindow)
            manager.setCurrentContext('newer-context')
            emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })

            expect(await manager.getCurrentContext()).toBe('newer-context')
        })

        it('uses the new context when the switch succeeds', async () => {
            const { manager, emit } = setup()

            emit('command', switchToWindow)
            emit('result', { ...switchToWindow, result: { value: null } })

            expect(await manager.getCurrentContext()).toBe('closed-tab')
        })
    })

    it('keeps the Appium context of a Classic session when switchToWindow fails', async () => {
        const stub = createBrowserStub({ isMobile: true, isAndroid: true, capabilities: { platformName: 'Android', browserName: 'chrome' } } as any)
        const manager = getContextManager(stub.browser)
        manager.setCurrentContext('CHROMIUM')
        const emit = (event: string, payload: unknown) => stub.getListeners()[event]!.forEach((handler) => handler(payload))
        const switchToWindow = { command: 'switchToWindow', body: { handle: 'closed-tab' } }

        emit('command', switchToWindow)
        emit('result', { ...switchToWindow, result: { error: new Error('no such window') } })

        expect(await manager.getCurrentContext()).toBe('CHROMIUM')
        expect(manager.mobileContext).toBe('CHROMIUM')
        expect(manager.isNativeContext).toBe(false)
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
})
