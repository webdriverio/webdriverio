import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { EventEmitter } from 'node:events'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import type * as UserCommands from '../src/userCommands.js'
import type { UserCommandFrame } from '../src/userCommands.js'
import type * as Shim from '../src/shim.js'
import type * as Monad from '../src/monad.js'
import type * as Kind from '../src/kind.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

// fresh modules per test: the id counter, the store and the names are per process
let mod: typeof UserCommands
let shim: typeof Shim
let monad: typeof Monad
let kind: typeof Kind
let store: AsyncLocalStorage<UserCommandFrame>

const NAMES = ['getText', 'getTitle', 'isDisplayed', 'waitForDisplayed', 'waitUntil', 'pause', 'setValue', '$$']

// a WebDriver BiDi session with the `wdio:experimentalBiDiCommands` capability: user command events are on by default
const BIDI_COMMANDS = { 'wdio:experimentalBiDiCommands': true }

function fakeBrowser (props: Record<string, unknown> = {}) {
    return { isBidi: true, options: {}, requestedCapabilities: BIDI_COMMANDS, emit: vi.fn(), ...props } as {
        isBidi: boolean
        options: Record<string, unknown>
        emit: ReturnType<typeof vi.fn>
        [key: string]: unknown
    }
}

const pairs = (browser: { emit: ReturnType<typeof vi.fn> }) => browser.emit.mock.calls

beforeEach(async () => {
    vi.resetModules()
    mod = await import('../src/userCommands.js')
    shim = await import('../src/shim.js')
    monad = await import('../src/monad.js')
    kind = await import('../src/kind.js')
    store = new AsyncLocalStorage<UserCommandFrame>()
    mod.setUserCommandStore(store)
    mod.registerUserCommands(NAMES)
})

describe('runUserCommand', () => {
    it('gives the promise of the command as it is when it sends nothing', () => {
        const browser = fakeBrowser({ isBidi: false })
        const result = Promise.resolve('hello')
        expect(mod.runUserCommand(browser, 'findElement', [], () => result)).toBe(result)
        expect(mod.runUserCommand(browser, 'getText', [], () => result)).toBe(result)
    })

    it('keeps the commands of another session hidden inside a command of a session that sends no events', async () => {
        const a = fakeBrowser({ isBidi: false })
        const b = fakeBrowser({ listenerCount: () => 1 })
        await mod.runUserCommand(a, 'waitUntil', [], async () => {
            for (let i = 0; i < 3; i++) {
                await mod.runUserCommand(b, 'getText', [], async () => 'x')
            }
        })
        expect(b.emit).not.toHaveBeenCalled()
    })

    it('sends one userCommand and one userResult with the same id for an outer call', async () => {
        const browser = fakeBrowser()
        expect(await mod.runUserCommand(browser, 'getText', [], async () => 'hello')).toBe('hello')
        expect(pairs(browser)).toEqual([
            ['userCommand', { id: 1, command: 'getText', body: [], protocol: 'bidi' }],
            ['userResult', { id: 1, command: 'getText', body: [], protocol: 'bidi', result: { value: 'hello' } }]
        ])
    })

    it('sends nothing for a nested registered command', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { nested: 'none' } } })
        await mod.runUserCommand(browser, 'waitForDisplayed', [], async () => {
            for (let i = 0; i < 3; i++) {
                await mod.runUserCommand(browser, 'isDisplayed', [], async () => i === 2)
            }
            return true
        })
        expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'waitForDisplayed'],
            ['userResult', 'waitForDisplayed']
        ])
    })

    it('sends nothing for a name that is not registered', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'findElement', [], async () => 'x')
        expect(browser.emit).not.toHaveBeenCalled()
    })

    it('sends nothing in a Classic session', async () => {
        const browser = fakeBrowser({ isBidi: false })
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(browser.emit).not.toHaveBeenCalled()
    })

    it('sends nothing when userCommandEvents is false', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: false } })
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(browser.emit).not.toHaveBeenCalled()
    })

    it('sends when userCommandEvents is true', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: true } })
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(browser.emit).toHaveBeenCalledTimes(2)
    })

    describe('default without userCommandEvents', () => {
        it('sends nothing in a WebDriver BiDi session with no wdio:experimentalBiDiCommands capability', async () => {
            const browser = fakeBrowser({ requestedCapabilities: {} })
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            expect(browser.emit).not.toHaveBeenCalled()
        })

        it('sends with the wdio:experimentalBiDiCommands capability of the session', async () => {
            const browser = fakeBrowser({ requestedCapabilities: {}, capabilities: BIDI_COMMANDS })
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            expect(browser.emit).toHaveBeenCalledTimes(2)
        })

        it('sends nothing for the protocol commands of a command that sends nothing', async () => {
            const browser = fakeBrowser({ requestedCapabilities: {} })
            await mod.runUserCommand(browser, 'getText', [], async () => {
                expect(mod.userCommandParent('getElementText')).toEqual({})
                return 'hello'
            })
        })
    })

    describe('option set in a session with no wdio:experimentalBiDiCommands capability', () => {
        it('sends with userCommandEvents true', async () => {
            const browser = fakeBrowser({ requestedCapabilities: {}, options: { userCommandEvents: true } })
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            expect(browser.emit).toHaveBeenCalledTimes(2)
        })

        it('sends with an exclude list, except for its names', async () => {
            const browser = fakeBrowser({ requestedCapabilities: {}, options: { userCommandEvents: { exclude: ['pause'] } } })
            await mod.runUserCommand(browser, 'pause', [1], async () => undefined)
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([['userCommand', 'getText'], ['userResult', 'getText']])
        })

        it('sends nothing with userCommandEvents false, also with the capability', async () => {
            const browser = fakeBrowser({ options: { userCommandEvents: false } })
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            expect(browser.emit).not.toHaveBeenCalled()
        })

        it('sends nothing in a WebDriver Classic session with userCommandEvents true and the capability', async () => {
            const browser = fakeBrowser({ isBidi: false, options: { userCommandEvents: true } })
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            expect(browser.emit).not.toHaveBeenCalled()
        })

        it('sends nothing in an Appium session with WebDriver BiDi, userCommandEvents true and the capability', async () => {
            const browser = fakeBrowser({ isMobile: true, options: { userCommandEvents: true } })
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            expect(browser.emit).not.toHaveBeenCalled()
        })
    })

    it('sends nothing for an excluded name', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { exclude: ['pause'] } } })
        await mod.runUserCommand(browser, 'pause', [100], async () => undefined)
        expect(browser.emit).not.toHaveBeenCalled()
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(browser.emit).toHaveBeenCalledTimes(2)
    })

    it('sends nothing for the commands inside an excluded command', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { exclude: ['waitUntil'] } } })
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => true)
            return true
        })
        expect(browser.emit).not.toHaveBeenCalled()
    })

    it('sends nothing when the browser has no emit', async () => {
        const browser = { isBidi: true, options: {} }
        expect(await mod.runUserCommand(browser, 'getText', [], async () => 'hello')).toBe('hello')
    })

    it('reads the option of the browser for an element', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: false } })
        await mod.runUserCommand({ elementId: 'abc', parent: browser }, 'getText', [], async () => 'hello')
        expect(browser.emit).not.toHaveBeenCalled()
    })

    it('sends nothing inside a command hook', async () => {
        const browser = fakeBrowser()
        browser.options = {
            beforeCommand: () => mod.runUserCommand(browser, 'getTitle', [], async () => 'title'),
            afterCommand: () => mod.runUserCommand(browser, 'getTitle', [], async () => 'title')
        }
        const getText = shim.wrapCommand('getText', async () => 'hello')
        expect(await getText.call(browser)).toBe('hello')
        expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'getText'],
            ['userResult', 'getText']
        ])
    })

    it('sends nothing when no store was set', async () => {
        vi.resetModules()
        const fresh = await import('../src/userCommands.js')
        fresh.registerUserCommands(['getText'])
        const browser = fakeBrowser()
        await fresh.runUserCommand(browser, 'getText', [], async () => {
            expect(fresh.currentUserCommandId()).toBeUndefined()
            return 'hello'
        })
        expect(browser.emit).not.toHaveBeenCalled()
    })

    it('sends the error, and the next call is an outer call', async () => {
        const browser = fakeBrowser()
        const error = new Error('boom')
        await expect(mod.runUserCommand(browser, 'getText', [], async () => { throw error })).rejects.toBe(error)
        expect(pairs(browser)[1]).toEqual(['userResult', { id: 1, command: 'getText', body: [], protocol: 'bidi', result: { error } }])

        await mod.runUserCommand(browser, 'getTitle', [], async () => 'title')
        expect(pairs(browser).slice(2)).toEqual([
            ['userCommand', { id: 2, command: 'getTitle', body: [], protocol: 'bidi' }],
            ['userResult', { id: 2, command: 'getTitle', body: [], protocol: 'bidi', result: { value: 'title' } }]
        ])
    })

    it('gives concurrent calls their own ids', async () => {
        const browser = fakeBrowser()
        const outer: (number | undefined)[] = []
        const inner: (number | undefined)[] = []
        const call = (ms: number) => mod.runUserCommand(browser, 'getText', [], async () => {
            outer.push(mod.currentUserCommandId())
            await new Promise((resolve) => setTimeout(resolve, ms))
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => {
                inner.push(mod.currentUserCommandId())
            })
            return ms
        })
        expect(await Promise.all([call(20), call(5)])).toEqual([20, 5])
        expect(outer).toEqual([1, 2])
        // the shorter call ends first, each nested call sees the id of its own outer call
        expect(inner).toEqual([2, 1])
        expect(pairs(browser).map(([event, payload]) => [event, payload.id])).toEqual([
            ['userCommand', 1],
            ['userCommand', 2],
            ['userResult', 2],
            ['userResult', 1]
        ])
    })

    it('sends no pair for call, and its commands are outer commands', async () => {
        mod.registerUserCommands(['call'])
        const browser = fakeBrowser({ options: { userCommandEvents: { nested: 'none' } } })
        const call = shim.wrapCommand('call', (fn: () => unknown) => fn())
        const getText = shim.wrapCommand('getText', async () => 'hello')
        expect(await call.call(browser, () => getText.call(browser))).toBe('hello')
        expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'getText'],
            ['userResult', 'getText']
        ])

        // in another user command, the commands in call stay nested
        browser.emit.mockClear()
        const waitUntil = shim.wrapCommand('waitUntil', (fn: () => unknown) => fn())
        await waitUntil.call(browser, () => call.call(browser, () => getText.call(browser)))
        expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'waitUntil'],
            ['userResult', 'waitUntil']
        ])
    })

    it('sends no pair for an overwritten call, and its commands are outer commands', async () => {
        const browser = fakeBrowser()
        const getText = shim.wrapCommand('getText', async () => 'hello')
        expect(await mod.runCustomCommand(browser, 'call', [], () => getText.call(browser))).toBe('hello')
        expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'getText'],
            ['userResult', 'getText']
        ])
    })

    it('sends the events of an element list query', async () => {
        const browser = fakeBrowser()
        let wrapper: ((load: () => Promise<unknown>) => Promise<unknown>) | undefined
        const list = { [shim.ELEMENT_ARRAY_WRAP]: (fn: typeof wrapper) => { wrapper = fn } }
        const query = shim.wrapCommand('$$', () => list)
        expect(query.call(browser, 'a')).toBe(list)
        await wrapper!(async () => [{ elementId: 'x' }, { elementId: 'y' }])
        expect(pairs(browser)).toEqual([
            ['userCommand', { id: 1, command: '$$', body: ['a'], protocol: 'bidi' }],
            // the result gives the query of the list and the number of elements found
            ['userResult', { id: 1, command: '$$', body: ['a'], protocol: 'bidi', result: { value: { wdio: 'element-array', query: [{ foundWith: '$$', selector: 'a' }], length: 2 } } }]
        ])
    })

    it.each([
        ['a WebDriver Classic session', { isBidi: false }],
        ['user command events off', { options: { userCommandEvents: false } }]
    ])('makes no copy of a loaded element list in %s', async (_name, props) => {
        const browser = fakeBrowser(props)
        let wrapper: ((load: () => Promise<unknown>) => Promise<unknown>) | undefined
        const list = { [shim.ELEMENT_ARRAY_WRAP]: (fn: typeof wrapper) => { wrapper = fn } }
        const query = shim.wrapCommand('$$', () => list)
        query.call(browser, 'a')
        let reads = 0
        // `await` reads `then`: a copy reads the items
        const loaded = new Proxy([{ elementId: 'x' }], { get: (target, prop, receiver) => { reads += prop === 'then' ? 0 : 1; return Reflect.get(target, prop, receiver) } })
        await wrapper!(async () => loaded)
        expect(reads).toBe(0)
        expect(pairs(browser)).toEqual([])
    })
})

describe('sendsUserCommands', () => {
    it.each([
        ['a Classic session', { isBidi: false }, false],
        ['an Appium session with WebDriver BiDi', { isMobile: true }, false],
        ['WebDriver BiDi with the capability', {}, true],
        ['WebDriver BiDi with the capability of the session', { requestedCapabilities: {}, capabilities: BIDI_COMMANDS }, true],
        ['WebDriver BiDi with no capability', { requestedCapabilities: {} }, false],
        ['WebDriver BiDi with userCommandEvents true', { requestedCapabilities: {}, options: { userCommandEvents: true } }, true],
        ['WebDriver BiDi with an exclude list', { requestedCapabilities: {}, options: { userCommandEvents: { exclude: ['pause'] } } }, true],
        ['WebDriver BiDi with userCommandEvents false', { options: { userCommandEvents: false } }, false],
        // null (a JavaScript config) is as not set
        ['WebDriver BiDi with userCommandEvents null and no capability', { requestedCapabilities: {}, options: { userCommandEvents: null } }, false],
        ['WebDriver BiDi with userCommandEvents null and the capability', { options: { userCommandEvents: null } }, true]
    ])('%s: %s', (_name, props, expected) => {
        expect(mod.sendsUserCommands(fakeBrowser(props))).toBe(expected)
    })

    it('runs a command with userCommandEvents null', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: null } })
        await expect(mod.runUserCommand(browser, 'getTitle', [], async () => 'title')).resolves.toBe('title')
        expect(pairs(browser).map(([event]) => event)).toEqual(['userCommand', 'userResult'])
    })

    it('is false with no browser', () => {
        expect(mod.sendsUserCommands(undefined)).toBe(false)
    })
})

describe('wrapCustomCommand', () => {
    it('sends one pair with the name of a command that is not registered, and runs the hooks outside of it', async () => {
        const browser = fakeBrowser()
        const calls: string[] = []
        browser.options = {
            userCommandEvents: { nested: 'none' },
            beforeCommand: () => { calls.push('before') },
            afterCommand: () => { calls.push('after') }
        }
        browser.emit.mockImplementation((event: string) => { calls.push(event) })
        const login = shim.wrapCustomCommand('login', function (this: unknown) {
            return mod.runUserCommand(this, 'pause', [], async () => 'ok')
        })
        expect(await login.call(browser, 'user')).toBe('ok')
        expect(pairs(browser).map(([event, payload]) => [event, payload.command, payload.body])).toEqual([
            ['userCommand', 'login', ['user']],
            ['userResult', 'login', ['user']]
        ])
        expect(calls).toEqual(['before', 'userCommand', 'userResult', 'after'])

        await shim.wrapCommand('login', async () => 'ok').call(browser)
        expect(browser.emit).toHaveBeenCalledTimes(2)
    })
})

describe('runUserCommand with an event result', () => {
    it('sends the event result and returns the result of the command as it is', async () => {
        const browser = fakeBrowser()
        mod.registerUserCommands(['expect.toHaveText'])
        const result = { pass: false, message: () => 'no' }
        const error = new Error('no')
        expect(await mod.runUserCommand(browser, 'expect.toHaveText', ['a'], async () => result, () => ({ error }))).toBe(result)
        expect(pairs(browser)[1]).toEqual(['userResult', expect.objectContaining({ command: 'expect.toHaveText', result: { error } })])
    })
})

describe('async stack of a command that fails', () => {
    const failing = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        throw new Error('Hello Bidi')
    }

    it('keeps the async frames of the caller of a user command', async () => {
        const browser = fakeBrowser()
        async function wrapCommandFrame () {
            return await mod.runUserCommand(browser, 'getText', [], () => failing())
        }
        async function testFrameworkFrame () {
            await wrapCommandFrame()
        }
        const error = await testFrameworkFrame().catch((err: Error) => err)
        expect((error as Error).stack).toContain('testFrameworkFrame')
        expect(pairs(browser).map(([event]) => event)).toEqual(['userCommand', 'userResult'])
    })

    it('keeps the async frames of the caller of a custom command with a promise result', async () => {
        const browser = fakeBrowser()
        async function customCommandFrame () {
            return await mod.runCustomCommand(browser, 'myCmd', [], () => failing())
        }
        async function testFrameworkFrame () {
            await customCommandFrame()
        }
        const error = await testFrameworkFrame().catch((err: Error) => err)
        expect((error as Error).stack).toContain('testFrameworkFrame')
        expect(pairs(browser).map(([event]) => event)).toEqual(['userCommand', 'userResult'])
    })

    it('keeps the async frames of the caller of a custom command of addCommand', async () => {
        const browser = monad.default({}, (c: unknown) => c, { isBidi: { value: true }, requestedCapabilities: { value: BIDI_COMMANDS } })('sessionId', shim.wrapCommand) as Record<string, Function>
        const events: string[] = []
        for (const event of ['command', 'result', 'userCommand', 'userResult']) {
            browser.on(event, () => events.push(event))
        }
        browser.addCommand('myCmd', async () => {
            await failing()
        })
        async function testFrameworkFrame () {
            await browser.myCmd()
        }
        const error = await testFrameworkFrame().catch((err: Error) => err)
        expect((error as Error).stack).toContain('testFrameworkFrame')
        expect(events).toEqual(['userCommand', 'command', 'result', 'userResult'])
    })

    it('keeps the async frames of the caller of a custom command of addCommand with no user command events', async () => {
        const browser = monad.default({}, (c: unknown) => c, { isBidi: { value: true }, requestedCapabilities: { value: {} } })('sessionId', shim.wrapCommand) as Record<string, Function>
        const events: string[] = []
        for (const event of ['command', 'result', 'userCommand', 'userResult']) {
            browser.on(event, () => events.push(event))
        }
        browser.addCommand('myCmd', async () => {
            await failing()
        })
        async function testFrameworkFrame () {
            await browser.myCmd()
        }
        const error = await testFrameworkFrame().catch((err: Error) => err)
        expect((error as Error).stack).toContain('testFrameworkFrame')
        expect(events).toEqual(['command', 'result'])
    })

    for (const [session, isBidi, unhandledCount] of [['WebDriver BiDi', true, 1], ['WebDriver Classic', false, 0]] as const) {
        it(`a failing custom command that the test does not await in a ${session} session`, async () => {
            const browser = monad.default({}, (c: unknown) => c, { isBidi: { value: isBidi }, requestedCapabilities: { value: {} } })('sessionId', shim.wrapCommand) as Record<string, Function>
            browser.addCommand('myCmd', () => failing())
            const unhandled: unknown[] = []
            const listeners = process.listeners('unhandledRejection')
            process.removeAllListeners('unhandledRejection')
            process.on('unhandledRejection', (reason) => unhandled.push(reason))
            try {
                browser.myCmd()
                await new Promise((resolve) => setTimeout(resolve, 20))
            } finally {
                process.removeAllListeners('unhandledRejection')
                listeners.forEach((listener) => process.on('unhandledRejection', listener))
            }
            expect(unhandled).toHaveLength(unhandledCount)
        })
    }

    it('keeps the result of a custom command when a listener of its old events throws', async () => {
        const browser = monad.default({}, (c: unknown) => c, { isBidi: { value: true }, requestedCapabilities: { value: BIDI_COMMANDS } })('sessionId', shim.wrapCommand) as Record<string, Function>
        browser.on('result', () => {
            throw new Error('listener')
        })
        browser.addCommand('myCmd', async () => 'done')
        browser.addCommand('failingCmd', () => failing())
        expect(await browser.myCmd()).toBe('done')
        await expect(browser.failingCmd()).rejects.toThrow('Hello Bidi')
    })

    it('keeps the result of a command when a listener throws', async () => {
        const browser = fakeBrowser()
        browser.emit.mockImplementation((event: string) => {
            if (event === 'userResult') {
                throw new Error('listener')
            }
        })
        expect(await mod.runUserCommand(browser, 'getText', [], async () => 'hello')).toBe('hello')
        await expect(mod.runUserCommand(browser, 'getText', [], () => failing())).rejects.toThrow('Hello Bidi')
        expect(await mod.runCustomCommand(browser, 'myCmd', [], async () => 'done')).toBe('done')
    })
})

describe('runUserCommand with no listener', () => {
    const client = () => monad.default({}, (c: unknown) => c, { isBidi: { value: true }, requestedCapabilities: { value: BIDI_COMMANDS } })('sessionId', shim.wrapCommand) as Record<string, Function>

    it('sends nothing and makes no copy, and keeps the id for the parent of its protocol commands', async () => {
        const browser = client()
        const emit = vi.spyOn(browser, 'emit')
        const getText = shim.wrapCommand('getText', async () => mod.currentUserCommandId())
        expect(await getText.call(browser)).toBe(1)
        expect(emit).not.toHaveBeenCalled()

        const events: string[] = []
        browser.on('userResult', (payload: { command: string }) => events.push(payload.command))
        expect(await getText.call(browser)).toBe(2)
        expect(events).toEqual(['getText'])
        browser.off('userResult')
        emit.mockClear()
        await getText.call(browser)
        expect(emit).not.toHaveBeenCalled()
    })

    it('counts the listeners of an event emitter', async () => {
        const browser = Object.assign(new EventEmitter(), { isBidi: true, options: {}, requestedCapabilities: BIDI_COMMANDS })
        const emit = vi.spyOn(browser, 'emit')
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(emit).not.toHaveBeenCalled()
        browser.on('userCommand', () => {})
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(emit.mock.calls.map(([event]) => event)).toEqual(['userCommand', 'userResult'])
    })
})

describe('runUserCommand with listeners and multi-remote', () => {
    it('sends the session of the browser in both events', async () => {
        const browser = fakeBrowser({ sessionId: 'session-1' })
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(pairs(browser).map(([event, payload]) => [event, payload.sessionId])).toEqual([
            ['userCommand', 'session-1'],
            ['userResult', 'session-1']
        ])
    })

    it('sends the session of each instance of a multi-remote browser', async () => {
        const instanceA = fakeBrowser({ sessionId: 'session-a' })
        const instanceB = fakeBrowser({ sessionId: 'session-b' })
        const multiRemote = fakeBrowser({ isBidi: undefined, isMultiRemote: true, sessionId: undefined })
        const instanceGetText = shim.wrapCommand('getText', async () => 'hello')
        const getText = shim.wrapCommand('getText', () => Promise.all(
            [instanceA, instanceB].map((instance) => instanceGetText.call(instance))
        ))
        await getText.call(multiRemote)
        expect(pairs(instanceA).map(([, payload]) => payload.sessionId)).toEqual(['session-a', 'session-a'])
        expect(pairs(instanceB).map(([, payload]) => payload.sessionId)).toEqual(['session-b', 'session-b'])
    })

    it('sends nothing for a command that a listener of the events runs', async () => {
        const browser = fakeBrowser()
        const spawned: Promise<unknown>[] = []
        let calls = 0
        // bounded, so a loop fails the test and does not overflow the stack
        browser.emit.mockImplementation(() => {
            if (++calls <= 10) {
                spawned.push(mod.runUserCommand(browser, 'getTitle', [], async () => 'title'))
            }
        })
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        await Promise.all(spawned)
        expect(spawned).toHaveLength(2)
        expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'getText'],
            ['userResult', 'getText']
        ])
    })

    it.each([
        ['browser', (mr: Record<string, unknown>) => mr],
        ['element', (mr: Record<string, unknown>) => ({ selector: 'a', options: {}, parent: mr })]
    ])('sends one pair for each instance of a multi-remote %s', async (_, scopeOf) => {
        const instanceA = fakeBrowser()
        const instanceB = fakeBrowser()
        const multiRemote = fakeBrowser({ isBidi: undefined, isMultiRemote: true })
        const instanceGetText = shim.wrapCommand('getText', async () => 'hello')
        const getText = shim.wrapCommand('getText', () => Promise.all(
            [instanceA, instanceB].map((instance) => instanceGetText.call(instance))
        ))
        expect(await getText.call(scopeOf(multiRemote))).toEqual(['hello', 'hello'])
        expect(multiRemote.emit).not.toHaveBeenCalled()
        expect(pairs(instanceA).map(([event, payload]) => [event, payload.id])).toEqual([['userCommand', 1], ['userResult', 1]])
        expect(pairs(instanceB).map(([event, payload]) => [event, payload.id])).toEqual([['userCommand', 2], ['userResult', 2]])
    })
})

describe('currentUserCommandId', () => {
    it('is the id of the outer call that sends events, also in a nested call', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { nested: 'none' } } })
        expect(mod.currentUserCommandId()).toBeUndefined()
        await mod.runUserCommand(browser, 'waitForDisplayed', [], async () => {
            expect(mod.currentUserCommandId()).toBe(1)
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => {
                expect(mod.currentUserCommandId()).toBe(1)
            })
        })
        expect(mod.currentUserCommandId()).toBeUndefined()
    })

    it('is undefined inside an outer call in a Classic session', async () => {
        const browser = fakeBrowser({ isBidi: false })
        await mod.runUserCommand(browser, 'waitForDisplayed', [], async () => {
            expect(mod.currentUserCommandId()).toBeUndefined()
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => {
                expect(mod.currentUserCommandId()).toBeUndefined()
            })
        })
    })

    it('is the id of an excluded outer call, which sends no events', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { exclude: ['waitUntil'] } } })
        const ids: (number | undefined)[] = []
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            ids.push(mod.currentUserCommandId())
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => {
                ids.push(mod.currentUserCommandId())
            })
        })
        expect(ids).toEqual([1, 1])
        expect(browser.emit).not.toHaveBeenCalled()
        // the next outer call gets its own id
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(pairs(browser).map(([event, payload]) => [event, payload.id])).toEqual([['userCommand', 2], ['userResult', 2]])
    })

    it.each([
        ['userCommandEvents false', { options: { userCommandEvents: false } }],
        ['a Classic session', { isBidi: false }]
    ])('is undefined inside an outer call with %s', async (_, props) => {
        const browser = fakeBrowser(props)
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            expect(mod.currentUserCommandId()).toBeUndefined()
        })
    })
    it('is undefined inside a command hook of a nested command', async () => {
        const browser = fakeBrowser()
        const ids: Record<string, number | undefined> = {}
        browser.options = {
            userCommandEvents: { nested: 'none' },
            beforeCommand: () => { ids.before = mod.currentUserCommandId() },
            afterCommand: () => { ids.after = mod.currentUserCommandId() }
        }
        const getText = shim.wrapCommand('getText', async () => { ids.command = mod.currentUserCommandId() })
        await mod.runUserCommand(browser, 'waitUntil', [], () => getText.call(browser))
        expect(ids).toEqual({ before: undefined, command: 1, after: undefined })
    })

    it('is undefined inside a command hook of an outer command', async () => {
        const browser = fakeBrowser()
        const ids: Record<string, number | undefined> = {}
        browser.options = {
            beforeCommand: () => { ids.before = mod.currentUserCommandId() },
            afterCommand: () => { ids.after = mod.currentUserCommandId() }
        }
        const getText = shim.wrapCommand('getText', async () => { ids.command = mod.currentUserCommandId() })
        await getText.call(browser)
        // toEqual ignores a missing key: check that the hooks ran
        expect(Object.keys(ids).sort()).toEqual(['after', 'before', 'command'])
        expect(ids).toEqual({ before: undefined, command: 1, after: undefined })
        expect(pairs(browser).map(([event]) => event)).toEqual(['userCommand', 'userResult'])
    })
})

describe('userCommandParent', () => {
    it('is the id of the outer call; a screenshot gets it as its owner', async () => {
        const browser = fakeBrowser()
        expect(mod.userCommandParent('getElementText')).toEqual({})
        expect(mod.userCommandParent('takeScreenshot')).toEqual({})
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            expect(mod.userCommandParent('getElementText')).toEqual({ parent: 1 })
            expect(mod.userCommandParent('takeScreenshot')).toEqual({ owner: 1 })
            expect(mod.userCommandParent('takeElementScreenshot')).toEqual({ owner: 1 })
        })
    })
})

describe('runWithoutUserCommands', () => {
    it('sends nothing for a registered command in a BiDi session', async () => {
        const browser = fakeBrowser()
        await mod.runWithoutUserCommands(() => mod.runUserCommand(browser, 'getText', [], async () => {
            expect(mod.currentUserCommandId()).toBeUndefined()
            return 'hello'
        }))
        expect(browser.emit).not.toHaveBeenCalled()
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(browser.emit).toHaveBeenCalledTimes(2)
    })

    it('hides the id of the outer call', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            await mod.runWithoutUserCommands(async () => {
                expect(store.getStore()).toEqual({})
                expect(mod.currentUserCommandId()).toBeUndefined()
            })
            expect(mod.currentUserCommandId()).toBe(1)
        })
    })

    it('sends nothing for the instances of a multi-remote command', async () => {
        const instance = fakeBrowser()
        const multiRemote = fakeBrowser({ isBidi: undefined, isMultiRemote: true })
        const instanceGetText = shim.wrapCommand('getText', async () => 'hello')
        const getText = shim.wrapCommand('getText', () => instanceGetText.call(instance))
        await mod.runWithoutUserCommands(() => getText.call(multiRemote))
        expect(instance.emit).not.toHaveBeenCalled()
    })
})

describe('runOutsideUserCommands', () => {
    it('runs a callback with no user command, also inside one', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            expect(mod.currentUserCommandId()).toBe(1)
            await mod.runOutsideUserCommands(async () => {
                expect(mod.currentUserCommandId()).toBeUndefined()
                await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
            })
        })
        expect(pairs(browser).map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'waitUntil'],
            ['userCommand', 'getText'],
            ['userResult', 'getText'],
            ['userResult', 'waitUntil']
        ])
    })
})

describe('nested calls', () => {
    it('sends nothing for a command in a frame with no id', async () => {
        const browser = fakeBrowser()
        await store.run({}, () => mod.runUserCommand(browser, 'getText', [], async () => 'hello'))
        expect(browser.emit).not.toHaveBeenCalled()
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(browser.emit).toHaveBeenCalledTimes(2)
    })

    it('runs in the frame of the outer call', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { nested: 'none' } } })
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            const frame = store.getStore()
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => {
                expect(store.getStore()).toBe(frame)
                expect(mod.currentUserCommandId()).toBe(1)
            })
        })
    })

    it('sends one pair for each instance command of a multi-remote custom command', async () => {
        const instanceA = fakeBrowser({ sessionId: 'session-a' })
        const instanceB = fakeBrowser({ sessionId: 'session-b' })
        const instanceGetText = shim.wrapCommand('getText', async () => 'hello')
        const getText = shim.wrapCommand('getText', () => Promise.all(
            [instanceA, instanceB].map((instance) => instanceGetText.call(instance))
        ))
        const multiRemote = monad.default({}, (c: unknown) => c, { isMultiRemote: { value: true } })('multiRemote', shim.wrapCommand) as Record<string, Function>
        multiRemote.addCommand('myCmd', function (this: unknown) {
            return getText.call(this)
        })
        expect(await multiRemote.myCmd()).toEqual(['hello', 'hello'])
        expect(pairs(instanceA).map(([event, payload]) => [event, payload.command, payload.sessionId])).toEqual([
            ['userCommand', 'getText', 'session-a'],
            ['userResult', 'getText', 'session-a']
        ])
        expect(pairs(instanceB).map(([event, payload]) => [event, payload.command, payload.sessionId])).toEqual([
            ['userCommand', 'getText', 'session-b'],
            ['userResult', 'getText', 'session-b']
        ])
    })

    it('is used by a custom command of the monad', async () => {
        const browser = fakeBrowser()
        const client = monad.default({}, (c: unknown) => c, {})('sessionId') as Record<string, Function>
        client.addCommand('myCommand', () => mod.runUserCommand(browser, 'getText', [], async () => 'hello'))
        expect(await client.myCommand()).toBe('hello')
        expect(browser.emit).not.toHaveBeenCalled()
    })
})

describe('nested user commands', () => {
    const events = (browser: { emit: ReturnType<typeof vi.fn> }) => pairs(browser)
        .map(([event, payload]) => [event, payload.command, payload.id, payload.parent])

    beforeEach(() => {
        mod.registerUserCommands(['click', 'execute', 'takeScreenshot'])
    })

    it('sends the direct calls of waitUntil with the id of waitUntil as parent', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            await mod.runUserCommand(browser, 'getText', [], async () => 'a')
            await mod.runUserCommand(browser, 'getText', [], async () => 'b')
            return true
        })
        expect(events(browser)).toEqual([
            ['userCommand', 'waitUntil', 1, undefined],
            ['userCommand', 'getText', 2, 1],
            ['userResult', 'getText', 2, 1],
            ['userCommand', 'getText', 3, 1],
            ['userResult', 'getText', 3, 1],
            ['userResult', 'waitUntil', 1, undefined]
        ])
    })

    it('keeps a top-level exclude with exact names, and ignores an exclude that is not a list of names', async () => {
        const star = fakeBrowser({ options: { userCommandEvents: { exclude: ['waitFor*'] } } })
        await mod.runUserCommand(star, 'waitForDisplayed', [], async () => true)
        expect(events(star).map(([event]) => event)).toEqual(['userCommand', 'userResult'])
        const broken = fakeBrowser({ options: { userCommandEvents: { exclude: true } } })
        await expect(mod.runUserCommand(broken, 'getText', [], async () => 'x')).resolves.toBe('x')
        expect(events(broken).map(([event]) => event)).toEqual(['userCommand', 'userResult'])
    })

    it('sends one pair for a command that two overwrites wrap', async () => {
        const client = monad.default({}, (c: unknown) => c, { isBidi: { value: true }, requestedCapabilities: { value: BIDI_COMMANDS } })('sessionId', shim.wrapCommand) as Record<string, Function>
        const names: string[] = []
        client.on('userCommand', (payload: { command: string }) => names.push(payload.command))
        client.addCommand('waitUntil', async () => true)
        client.overwriteCommand('waitUntil', async (orig: Function) => orig())
        client.overwriteCommand('waitUntil', async (orig: Function) => orig())
        await client.waitUntil()
        expect(names).toEqual(['waitUntil'])
    })

    it('sends no events for a command that a listener of the events of waitUntil runs', async () => {
        const browser = fakeBrowser()
        const listened: Promise<unknown>[] = []
        browser.emit.mockImplementation((event: string, payload: { command: string }) => {
            if (event === 'userCommand' && payload.command === 'waitUntil') {
                listened.push(mod.runUserCommand(browser, 'getTitle', [], async () => 't'))
            }
        })
        await mod.runUserCommand(browser, 'waitUntil', [], async () => true)
        await Promise.all(listened)
        expect(events(browser).map(([event, command]) => `${event} ${command}`)).toEqual(['userCommand waitUntil', 'userResult waitUntil'])
    })

    it('sends no events for a direct call that starts after the result of its parent', async () => {
        const browser = fakeBrowser()
        let release!: () => void
        const gate = new Promise<void>((resolve) => { release = resolve })
        let late: Promise<unknown> | undefined
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            // a poll that still runs when waitUntil ends
            late = gate.then(() => mod.runUserCommand(browser, 'getText', [], async () => 'late'))
            return true
        })
        release()
        await late
        expect(events(browser).map(([event, command]) => `${event} ${command}`)).toEqual(['userCommand waitUntil', 'userResult waitUntil'])
    })

    it('sends no events for the calls of a command that does not expand', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'click', [], () => mod.runUserCommand(browser, 'getText', [], async () => 'a'))
        expect(events(browser)).toEqual([['userCommand', 'click', 1, undefined], ['userResult', 'click', 1, undefined]])
    })

    it('expands only the direct calls: the calls inside a nested getText send nothing', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'waitUntil', [], () => mod.runUserCommand(browser, 'getText', [], () =>
            mod.runUserCommand(browser, 'execute', [], async () => 'a')))
        expect(events(browser).map(([event, command]) => `${event} ${command}`)).toEqual([
            'userCommand waitUntil', 'userCommand getText', 'userResult getText', 'userResult waitUntil'
        ])
    })

    it('expands every command with nested: all', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { nested: 'all' } } })
        await mod.runUserCommand(browser, 'click', [], () => mod.runUserCommand(browser, 'getText', [], () =>
            mod.runUserCommand(browser, 'execute', [], async () => 'a')))
        expect(events(browser)).toEqual([
            ['userCommand', 'click', 1, undefined],
            ['userCommand', 'getText', 2, 1],
            ['userCommand', 'execute', 3, 2],
            ['userResult', 'execute', 3, 2],
            ['userResult', 'getText', 2, 1],
            ['userResult', 'click', 1, undefined]
        ])
    })

    it('keeps a collapsed custom command as one closed step', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { nested: { collapse: ['readX'] } } } })
        await mod.runCustomCommand(browser, 'readX', [], () => mod.runUserCommand(browser, 'getText', [], async () => 'a'))
        expect(events(browser)).toEqual([['userCommand', 'readX', 1, undefined], ['userResult', 'readX', 1, undefined]])
    })

    it('marks the old events of a nested custom command with custom: true', async () => {
        const client = monad.default({}, (c: unknown) => c, { isBidi: { value: true }, requestedCapabilities: { value: BIDI_COMMANDS } })('sessionId', shim.wrapCommand) as Record<string, Function>
        const old: Record<string, unknown>[] = []
        const user: Record<string, unknown>[] = []
        client.on('command', (payload: Record<string, unknown>) => old.push(payload))
        client.on('userCommand', (payload: Record<string, unknown>) => user.push(payload))
        client.addCommand('inner', async () => 'done')
        await mod.runUserCommand(client, 'waitUntil', [], () => client.inner())
        expect(user.map(({ command, parent }) => [command, parent])).toEqual([['waitUntil', undefined], ['inner', 1]])
        expect(old).toEqual([expect.objectContaining({ command: 'inner', parent: 2, custom: true })])
    })

    it('sends no nested events in a command hook, a command with no events, an excluded command or a session with events off', async () => {
        const hooks = await import('../src/commandHooks.js')
        const nestedGetText = (browser: object) => () => mod.runUserCommand(browser, 'getText', [], async () => 'a')
        const inHook = fakeBrowser()
        await mod.runUserCommand(inHook, 'waitUntil', [], () => hooks.runInCommandHook(nestedGetText(inHook)))
        const inScreenshot = fakeBrowser()
        await mod.runUserCommand(inScreenshot, 'takeScreenshot', [], nestedGetText(inScreenshot))
        const excluded = fakeBrowser({ options: { userCommandEvents: { exclude: ['waitUntil'] } } })
        await mod.runUserCommand(excluded, 'waitUntil', [], nestedGetText(excluded))
        const off = fakeBrowser({ options: { userCommandEvents: false } })
        await mod.runUserCommand(off, 'waitUntil', [], nestedGetText(off))
        expect(events(inHook).map(([event, command]) => `${event} ${command}`)).toEqual(['userCommand waitUntil', 'userResult waitUntil'])
        expect([events(inScreenshot), events(excluded), events(off)]).toEqual([[], [], []])
    })

    it('sends a list item that waits inside waitUntil with its index and parent', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'waitUntil', [], () => mod.runListItem(browser, '$$', ['li'], 3, async () => 'item'))
        expect(pairs(browser)[1]).toEqual(['userCommand', expect.objectContaining({ command: '$$', index: 3, parent: 1 })])
    })

    it('keeps the commands of the instances of a multi-remote custom command as outer commands, and expands an instance custom command', async () => {
        const instance = fakeBrowser({ options: { userCommandEvents: { nested: { expand: ['mine'] } } } })
        const multiRemote = fakeBrowser({ isMultiRemote: true })
        await mod.runCustomCommand(multiRemote, 'both', [], () => mod.runUserCommand(instance, 'getText', [], async () => 'a'))
        await mod.runCustomCommand(instance, 'mine', [], () => mod.runUserCommand(instance, 'getText', [], async () => 'b'))
        expect(events(instance)).toEqual([
            ['userCommand', 'getText', 1, undefined],
            ['userResult', 'getText', 1, undefined],
            ['userCommand', 'mine', 2, undefined],
            ['userCommand', 'getText', 3, 2],
            ['userResult', 'getText', 3, 2],
            ['userResult', 'mine', 2, undefined]
        ])
        expect(events(multiRemote)).toEqual([])
    })
})

describe('custom commands', () => {
    const EVENTS = ['command', 'result', 'userCommand', 'userResult']

    function client (props: Record<string, PropertyDescriptor> = {}, options: Record<string, unknown> = {}) {
        const browser = monad.default(options, (c: unknown) => c, { isBidi: { value: true }, requestedCapabilities: { value: BIDI_COMMANDS }, ...props })('sessionId', shim.wrapCommand) as Record<string, Function>
        const events: [string, Record<string, unknown>][] = []
        for (const event of EVENTS) {
            browser.on(event, (payload: Record<string, unknown>) => events.push([event, payload]))
        }
        return { browser, events }
    }
    const names = (events: [string, Record<string, unknown>][]) => events.map(([event, payload]) => [event, payload.command, payload.parent])

    it('sends one pair for a custom command, and its old events get the id as parent', async () => {
        const { browser, events } = client()
        browser.addCommand('myCmd', async (text: string) => `${text}!`)
        expect(await browser.myCmd('secret', { mask: true })).toBe('secret!')
        expect(names(events)).toEqual([
            ['userCommand', 'myCmd', undefined],
            ['command', 'myCmd', 1],
            ['result', 'myCmd', 1],
            ['userResult', 'myCmd', undefined]
        ])
        expect(events[0][1]).toEqual({ id: 1, command: 'myCmd', body: ['**MASKED**', { mask: true }], protocol: 'bidi', sessionId: 'sessionId' })
        expect(events[3][1]).toEqual({ id: 1, command: 'myCmd', body: ['**MASKED**', { mask: true }], protocol: 'bidi', sessionId: 'sessionId', result: { value: 'secret!' } })
    })

    it('sends the error of a custom command', async () => {
        const { browser, events } = client()
        browser.addCommand('myCmd', async () => {
            throw new Error('boom')
        })
        await expect(browser.myCmd()).rejects.toThrow('boom')
        expect(names(events)).toEqual([
            ['userCommand', 'myCmd', undefined],
            ['command', 'myCmd', 1],
            ['result', 'myCmd', 1],
            ['userResult', 'myCmd', undefined]
        ])
        expect(events[3][1].result).toEqual({ error: expect.objectContaining({ message: 'boom' }) })
    })

    it('sends one pair for an overwritten registered command', async () => {
        mod.registerUserCommands(['click'])
        const { browser, events } = client({ click: { value: shim.wrapCommand('click', async () => 'clicked'), writable: true, configurable: true } })
        browser.overwriteCommand('click', async (origClick: Function) => origClick())
        expect(await browser.click()).toBe('clicked')
        expect(names(events)).toEqual([
            ['userCommand', 'click', undefined],
            ['command', 'click', 1],
            ['result', 'click', 1],
            ['userResult', 'click', undefined]
        ])
    })

    it('sends no pair for a nested custom command, and its old events get the outer id as parent', async () => {
        const { browser, events } = client({}, { userCommandEvents: { nested: 'none' } })
        browser.addCommand('inner', async () => 'inner')
        browser.addCommand('outer', async function (this: Record<string, Function>) {
            return this.inner()
        })
        expect(await browser.outer()).toBe('inner')
        expect(names(events)).toEqual([
            ['userCommand', 'outer', undefined],
            ['command', 'outer', 1],
            ['command', 'inner', 1],
            ['result', 'inner', 1],
            ['result', 'outer', 1],
            ['userResult', 'outer', undefined]
        ])
    })

    it('marks the old events of the custom command that is the user command, not those of a nested call of the same name', async () => {
        const { browser, events } = client({}, { userCommandEvents: { nested: 'none' } })
        browser.addCommand('countDown', async function (this: Record<string, Function>, n: number) {
            return n > 0 ? this.countDown(n - 1) : 'done'
        })
        expect(await browser.countDown(1)).toBe('done')
        expect(events.map(([event, payload]) => [event, payload.command, payload.parent, payload.custom])).toEqual([
            ['userCommand', 'countDown', undefined, undefined],
            ['command', 'countDown', 1, true],
            ['command', 'countDown', 1, undefined],
            ['result', 'countDown', 1, undefined],
            ['result', 'countDown', 1, true],
            ['userResult', 'countDown', undefined, undefined]
        ])
    })

    it('keeps the chainable result of a custom element query', async () => {
        const { browser, events } = client()
        browser.addCommand('byTestId$', async (selector: string) => ({ elementId: `el-${selector}`, getText: async () => 'text' }))
        const element = browser.byTestId$('a')
        expect(typeof element.getText).toBe('function')
        expect(await element.getText()).toBe('text')
        expect(names(events).filter(([event]) => event.startsWith('user'))).toEqual([
            ['userCommand', 'byTestId$', undefined],
            ['userResult', 'byTestId$', undefined]
        ])
        expect(events.at(-1)![1].result).toEqual({ value: { elementId: 'el-a', getText: '[Function getText]' } })
    })

    it('keeps the chainable result of a custom element query that fails, with no unhandled rejection', async () => {
        const { browser, events } = client()
        browser.addCommand('missing$', async () => {
            throw new Error('not found')
        })
        await expect(browser.missing$('a')).rejects.toThrow('not found')
        const userEvents = events.filter(([event]) => event.startsWith('user'))
        expect(userEvents.map(([event]) => event)).toEqual(['userCommand', 'userResult'])
        expect(userEvents[1][1].result).toEqual({ error: expect.objectContaining({ message: 'not found' }) })
    })

    it('keeps the element list of an overwritten $$', async () => {
        const items = ['a', 'b']
        let wrapper = (load: () => Promise<unknown>) => load()
        // as an ElementArray, the list loads once
        let loaded: Promise<string[]> | undefined
        const list = Object.assign([...items], {
            [shim.ELEMENT_ARRAY_WRAP]: (fn: typeof wrapper) => { wrapper = fn },
            then (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
                loaded ??= wrapper(async () => [...items]).then(() => [...items])
                return loaded.then(resolve, reject)
            },
            async *[Symbol.asyncIterator] () {
                yield* items
            }
        })
        const { browser, events } = client({ $$: { value: shim.wrapCommand('$$', () => list), writable: true, configurable: true } })
        browser.overwriteCommand('$$', (orig$$: Function, selector: string) => orig$$(selector))

        const result = browser.$$('a')
        expect(result).toBe(list)
        expect(result.map((item: string) => item.toUpperCase())).toEqual(['A', 'B'])
        const iterated: string[] = []
        for await (const item of result) {
            iterated.push(item)
        }
        expect(iterated).toEqual(items)
        await result
        expect(names(events).filter(([event]) => event.startsWith('user'))).toEqual([
            ['userCommand', '$$', undefined],
            ['userResult', '$$', undefined]
        ])
        expect(events.find(([event]) => event === 'userResult')![1].result).toEqual({ value: items })
    })

    it('keeps the pending element list of an async custom $$ command', async () => {
        const { browser, events } = client()
        browser.addCommand('rows$$', async () => ['a', 'b'])
        const rows = browser.rows$$()
        expect(kind.getWdioKind(rows)).toBe('element-array')
        expect(typeof rows.at).toBe('function')
        expect(await rows).toEqual(['a', 'b'])
        const userEvents = events.filter(([event]) => event.startsWith('user'))
        expect(userEvents.map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'rows$$'],
            ['userResult', 'rows$$']
        ])
        expect(userEvents[1][1].result).toEqual({ value: ['a', 'b'] })
    })

    it('keeps the pending element list of an async custom $$ command that fails', async () => {
        const { browser, events } = client()
        browser.addCommand('rows$$', async () => {
            throw new Error('no rows')
        })
        const rows = browser.rows$$()
        expect(kind.getWdioKind(rows)).toBe('element-array')
        await expect(rows).rejects.toThrow('no rows')
        const userEvents = events.filter(([event]) => event.startsWith('user'))
        expect(userEvents.map(([event]) => event)).toEqual(['userCommand', 'userResult'])
        expect(userEvents[1][1].result).toEqual({ error: expect.objectContaining({ message: 'no rows' }) })
    })

    it('sends a pending element list that fails as an argument with no unhandled rejection', async () => {
        const { browser, events } = client()
        const unhandled: unknown[] = []
        const onUnhandled = (reason: unknown) => unhandled.push(reason)
        process.on('unhandledRejection', onUnhandled)
        try {
            browser.addCommand('rows$$', async () => {
                throw new Error('no rows')
            })
            browser.addCommand('countRows', async (rows: Promise<unknown[]>) => (await rows).length)
            await expect(browser.countRows(browser.rows$$())).rejects.toThrow('no rows')
            await new Promise((resolve) => setTimeout(resolve, 10))
            expect(unhandled).toEqual([])
            const [, { body }] = events.find(([event, payload]) => event === 'userCommand' && payload.command === 'countRows')!
            expect(body).toEqual([{ wdio: 'element-array', query: [{ foundWith: 'rows$$' }] }])
        } finally {
            process.off('unhandledRejection', onUnhandled)
        }
    })

    it('sends the wait of an item past the end of a pending list as the item of the list', async () => {
        const { browser, events } = client({ options: { value: {} } })
        let calls = 0
        browser.addCommand('waitUntil', async (condition: () => Promise<unknown>) => condition())
        // a plain array (no ElementArray): the first query finds 1 row, the next one 3
        browser.addCommand('rows$$', async function (this: unknown, selector: string) {
            return Object.assign(++calls === 1 ? ['a'] : ['a', 'b', 'c'], { selector, foundWith: 'rows$$', parent: this })
        })
        expect(await (browser.rows$$('tr') as unknown as Record<number, Promise<unknown>>)[2]).toBe('c')
        const userEvents = events.filter(([event]) => event.startsWith('user'))
        expect(userEvents.map(([event, payload]) => [event, payload.command, payload.index])).toEqual([
            ['userCommand', 'rows$$', undefined],
            ['userResult', 'rows$$', undefined],
            ['userCommand', 'rows$$', 2],
            ['userResult', 'rows$$', 2]
        ])
        expect(userEvents[2][1].body).toEqual(['tr'])
    })

    it('keeps the pending element list of an async overwrite of $$', async () => {
        const { browser, events } = client({ $$: { value: shim.wrapCommand('$$', async () => ['a']), writable: true, configurable: true } })
        browser.overwriteCommand('$$', async (orig$$: Function, selector: string) => orig$$(selector))
        const list = browser.$$('a')
        expect(kind.getWdioKind(list)).toBe('element-array')
        expect(typeof list.at).toBe('function')
        expect(await list).toEqual(['a'])
        const userEvents = events.filter(([event]) => event.startsWith('user'))
        expect(userEvents.map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', '$$'],
            ['userResult', '$$']
        ])
        expect(userEvents[1][1].result).toEqual({ value: ['a'] })
    })

    it('sends one pair for a custom command of an element', async () => {
        const { browser } = client()
        browser.addCommand('myElementCmd', async () => 'done', { attachToElement: true })
        const myElementCmd = (browser.__propertiesObject__ as Record<string, PropertyDescriptor>).myElementCmd.value as Function
        const element = { selector: 'a', options: {}, parent: browser }
        const userEvents = vi.spyOn(browser, 'emit')
        expect(await myElementCmd.call(element)).toBe('done')
        expect(userEvents.mock.calls.map(([event, payload]) => [event, payload.command])).toEqual([
            ['userCommand', 'myElementCmd'],
            ['userResult', 'myElementCmd']
        ])
    })

    it('sends only the arguments of the caller for an element overwrite', async () => {
        mod.registerUserCommands(['click'])
        const { browser } = client()
        browser.overwriteCommand('click', async function (origClick: Function, options?: unknown) {
            return origClick(options)
        }, { attachToElement: true })
        const overrides = (browser.__propertiesObject__ as Record<string, PropertyDescriptor>).__elementOverrides__
        const element = monad.default({}, (c: unknown) => c, {
            click: { value: async (options?: unknown) => ['clicked', options] },
            __elementOverrides__: overrides
        })('sessionId', shim.wrapCommand) as Record<string, unknown> & { click: Function }
        element.parent = browser
        element.selector = '#btn'
        const userEvents = vi.spyOn(browser, 'emit')

        expect(await element.click()).toEqual(['clicked', undefined])
        expect(await element.click({ button: 'left' })).toEqual(['clicked', { button: 'left' }])
        expect(userEvents.mock.calls.map(([event, payload]) => [event, payload.command, payload.body])).toEqual([
            ['userCommand', 'click', []],
            ['userResult', 'click', []],
            ['userCommand', 'click', [{ button: 'left' }]],
            ['userResult', 'click', [{ button: 'left' }]]
        ])
    })

    it('sends only the arguments of the caller for a browser overwrite', async () => {
        const { browser, events } = client({ url: { value: async (path: string) => path, writable: true, configurable: true } })
        browser.overwriteCommand('url', (origUrl: Function, path: string) => origUrl(path))
        expect(await browser.url('https://a.b')).toBe('https://a.b')
        expect(events.filter(([event]) => event.startsWith('user')).map(([event, payload]) => [event, payload.body])).toEqual([
            ['userCommand', ['https://a.b']],
            ['userResult', ['https://a.b']]
        ])
    })

    it('sends no pair for an overwritten takeScreenshot and keeps its result', async () => {
        const base64 = 'iVBORw0KGgo'.repeat(200)
        const { browser, events } = client({ takeScreenshot: { value: async () => base64, writable: true, configurable: true } })
        browser.overwriteCommand('takeScreenshot', (origTakeScreenshot: Function) => origTakeScreenshot())
        expect(await browser.takeScreenshot()).toBe(base64)
        expect(names(events)).toEqual([
            ['command', 'takeScreenshot', undefined],
            ['result', 'takeScreenshot', undefined]
        ])
    })

    it('sends no pair for takeElementScreenshot of an element', async () => {
        const base64 = 'iVBORw0KGgo'.repeat(200)
        const { browser } = client()
        browser.addCommand('takeElementScreenshot', async () => base64, { attachToElement: true })
        const takeElementScreenshot = (browser.__propertiesObject__ as Record<string, PropertyDescriptor>).takeElementScreenshot.value as Function
        const element = { selector: 'a', options: {}, parent: browser }
        const userEvents = vi.spyOn(browser, 'emit')
        expect(await takeElementScreenshot.call(element)).toBe(base64)
        expect(userEvents).not.toHaveBeenCalled()
    })

    it('sends one pair for an overwritten getTitle', async () => {
        const { browser, events } = client({ getTitle: { value: async () => 'title', writable: true, configurable: true } })
        browser.overwriteCommand('getTitle', (origGetTitle: Function) => origGetTitle())
        expect(await browser.getTitle()).toBe('title')
        expect(names(events).filter(([event]) => event.startsWith('user'))).toEqual([
            ['userCommand', 'getTitle', undefined],
            ['userResult', 'getTitle', undefined]
        ])
    })

    it('sends one pair for saveScreenshot with a short copy of the Buffer', async () => {
        mod.registerUserCommands(['saveScreenshot'])
        const browser = fakeBrowser()
        const saveScreenshot = shim.wrapCommand('saveScreenshot', async () => Buffer.alloc(2048))
        expect((await saveScreenshot.call(browser, './shot.png') as Buffer).byteLength).toBe(2048)
        expect(pairs(browser)).toEqual([
            ['userCommand', { id: 1, command: 'saveScreenshot', body: ['./shot.png'], protocol: 'bidi' }],
            ['userResult', { id: 1, command: 'saveScreenshot', body: ['./shot.png'], protocol: 'bidi', result: { value: '<Buffer 2048 bytes>' } }]
        ])
    })

    it.each([
        ['a Classic session', { isBidi: { value: false } }, () => {}],
        ['userCommandEvents false', {}, (browser: Record<string, unknown>) => { (browser.options as Record<string, unknown>).userCommandEvents = false }]
    ])('keeps the old events as they are in %s', async (_, props, setup) => {
        const { browser, events } = client(props)
        setup(browser)
        browser.addCommand('inner', async () => 'inner')
        browser.addCommand('outer', async function (this: Record<string, Function>) {
            return this.inner()
        })
        await browser.outer('a')
        expect(events).toEqual([
            ['command', { command: 'outer', body: ['a'] }],
            ['command', { command: 'inner', body: [] }],
            ['result', { command: 'inner', result: { value: 'inner' } }],
            ['result', { command: 'outer', result: { value: 'inner' } }]
        ])
    })

    it('keeps the old events as they are with no store, in a command hook and without user commands', async () => {
        const expected = [
            ['command', { command: 'myCmd', body: [] }],
            ['result', { command: 'myCmd', result: { value: 'x' } }]
        ]
        const run = async (wrap: (browser: Record<string, Function>) => Promise<unknown>) => {
            const { browser, events } = client()
            browser.addCommand('myCmd', async () => 'x')
            await wrap(browser)
            expect(events.filter(([, payload]) => payload.command === 'myCmd')).toEqual(expected)
        }
        await run((browser) => mod.runWithoutUserCommands(() => browser.myCmd()))
        await run((browser) => {
            (browser.options as unknown as Record<string, unknown>).beforeCommand = () => browser.myCmd()
            return shim.wrapCommand('getText', async () => 'hello').call(browser)
        })
        mod.setUserCommandStore(undefined as unknown as UserCommands.UserCommandStore)
        await run((browser) => browser.myCmd())
    })
})

describe('userCommandBody', () => {
    it('masks the text of a masked value', () => {
        expect(mod.userCommandBody(['secret', { mask: true }])).toEqual(['**MASKED**', { mask: true }])
        expect(mod.userCommandBody([42, { mask: true }])).toEqual(['**MASKED**', { mask: true }])
        expect(mod.userCommandBody(['visible', { mask: false }])).toEqual(['visible', { mask: false }])
    })

    it('never sends a masked value', async () => {
        const browser = fakeBrowser()
        const elem = { elementId: 'abc', parent: browser }
        await mod.runUserCommand(elem, 'setValue', ['secret', { mask: true }], async () => undefined)
        expect(browser.emit).toHaveBeenCalledTimes(2)
        expect(JSON.stringify(pairs(browser))).not.toContain('secret')
    })
})

describe('shortCopy', () => {
    it('makes short copies', () => {
        expect(mod.shortCopy(Buffer.from('abc'))).toBe('<Buffer 3 bytes>')
        expect(mod.shortCopy(new Uint8Array(5))).toBe('<Uint8Array 5 bytes>')

        const long = mod.shortCopy('a'.repeat(2000)) as string
        expect(long).toBe('a'.repeat(1024) + '… [2000 bytes]')
        expect(mod.shortCopy('a'.repeat(1024))).toBe('a'.repeat(1024))

        expect(mod.shortCopy(function foo () {})).toBe('[Function foo]')
        expect(mod.shortCopy(kind.setWdioKind({ elementId: 'abc', selector: 'a' }, 'element'))).toEqual({ wdio: 'element', query: [{ selector: 'a' }], elementId: 'abc' })
        expect(mod.shortCopy(kind.setWdioKind({ selector: 'a' }, 'element'))).toEqual({ wdio: 'element', query: [{ selector: 'a' }], found: false })
        expect(mod.shortCopy(kind.setWdioKind({}, 'browser'))).toBe('WebdriverIO.Browser')
        expect(mod.shortCopy(kind.setWdioKind({ isMultiRemote: true }, 'browser'))).toBe('WebdriverIO.MultiRemoteBrowser')

        const circular: Record<string, unknown> = { a: 1, list: [Buffer.from('x')] }
        circular.self = circular
        expect(() => mod.shortCopy(circular)).not.toThrow()
        expect(mod.shortCopy(circular)).toEqual({ a: 1, list: ['<Buffer 1 bytes>'], self: '[Circular]' })
    })

    it('gives an element its query from the browser, then its id or "found: false"', () => {
        const parent = kind.setWdioKind({ foundWith: '$', selector: '#form', props: [] }, 'element')
        expect(mod.shortCopy(kind.setWdioKind({ elementId: 'abc', foundWith: 'shadow$', selector: '#btn', parent }, 'element'))).toEqual({
            wdio: 'element', query: [{ foundWith: '$', selector: '#form' }, { foundWith: 'shadow$', selector: '#btn' }], elementId: 'abc'
        })
        expect(mod.shortCopy(kind.setWdioKind({ elementId: 'abc', foundWith: '$', selector: function nextElement () {} }, 'element'))).toEqual({
            wdio: 'element', query: [{ foundWith: '$', selector: '[Function nextElement]' }], elementId: 'abc'
        })
        expect(mod.shortCopy(kind.setWdioKind({ selector: '#missing', error: new Error('no') }, 'element'))).toEqual({ wdio: 'element', query: [{ selector: '#missing' }], found: false })
        expect(mod.shortCopy(kind.setWdioKind({}, 'element'))).toEqual({ wdio: 'element', found: false })
    })

    it('gives a custom strategy by its name and the item of a list with its index', () => {
        const strategy = { strategy: () => null, strategyName: 'byTestId', strategyArguments: ['row'] }
        expect(mod.shortCopy(kind.setWdioKind({ elementId: 'abc', foundWith: 'custom$$', selector: strategy, props: ['row'], index: 1 }, 'element'))).toEqual({
            wdio: 'element', query: [{ foundWith: 'custom$$', selector: 'byTestId', props: ['row'], index: 1 }], elementId: 'abc'
        })
    })

    it('gives a pending chainable element no id and no "not found"', () => {
        const chainable = Object.assign(kind.setWdioKind({ selector: '#btn' }, 'element'), { [kind.WDIO_CHAINABLE]: true })
        expect(mod.shortCopy(chainable)).toEqual({ wdio: 'element' })
    })

    it('gives a pending element of $ its query, with no command', async () => {
        const browser = fakeBrowser()
        const query = vi.fn(async (selector: string) => ({ elementId: 'abc', selector }))
        const $ = shim.wrapCommand('$', query)
        const chainable = $.call(browser, '#btn') as unknown as Promise<unknown>
        expect(mod.shortCopy(chainable)).toEqual({ wdio: 'element', query: [{ foundWith: '$', selector: '#btn' }] })
        await chainable
        expect(query).toHaveBeenCalledTimes(1)
    })

    it('gives a pending element the query of its chain, with no command', async () => {
        const browser = fakeBrowser()
        const element = { elementId: 'abc', selector: '#a', options: {} }
        const query = vi.fn(async () => Object.assign(element, {
            $: async () => ({ elementId: 'def' }),
            nextElement: async () => ({ elementId: 'mno' }),
            shadow$: async () => ({ elementId: 'ghi' }),
            custom$: async () => ({ elementId: 'jkl' })
        }))
        const $ = shim.wrapCommand('$', query)
        const root = $.call(browser, '#a') as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>
        const chain = [root.$('#b'), root.shadow$('input[name="email"]'), root.custom$('byTestId', 'name'), root.nextElement()]
        const root$ = { foundWith: '$', selector: '#a' }
        expect(chain.map((pending) => mod.shortCopy(pending))).toEqual([
            { wdio: 'element', query: [root$, { foundWith: '$', selector: '#b' }] },
            { wdio: 'element', query: [root$, { foundWith: 'shadow$', selector: 'input[name="email"]' }] },
            { wdio: 'element', query: [root$, { foundWith: 'custom$', selector: 'byTestId', props: ['name'] }] },
            { wdio: 'element', query: [root$, { foundWith: 'nextElement' }] }
        ])
        const list = shim.wrapCommand('$$', async () => [element, element]).call(browser, 'li') as unknown as Record<number, unknown>
        expect(mod.shortCopy(list)).toEqual({ wdio: 'element-array', query: [{ foundWith: '$$', selector: 'li' }] })
        expect(mod.shortCopy(list[1])).toEqual({ wdio: 'element', query: [{ foundWith: '$$', selector: 'li', index: 1 }] })
        await Promise.all([...chain, list, list[1]])
        expect(query).toHaveBeenCalledTimes(1)
    })

    it('labels an asymmetric matcher of an assertion with its name and its sample', () => {
        const matcher = (name: string, sample?: unknown, text?: string) => ({
            $$typeof: Symbol.for('jest.asymmetricMatcher'), sample, toString: () => name,
            ...(text ? { toAsymmetricMatcher: () => text } : {})
        })
        expect(mod.shortCopy(matcher('StringContaining', 'ab'))).toBe('[Matcher StringContaining "ab"]')
        expect(mod.shortCopy(matcher('StringMatching', /a.b/))).toBe('[Matcher StringMatching /a.b/]')
        expect(mod.shortCopy(matcher('Any', String, 'Any<String>'))).toBe('[Matcher Any<String>]')
    })

    it('writes the sample of an asymmetric matcher with the limits of a copy', () => {
        const matcher = (sample: unknown) => ({ $$typeof: Symbol.for('jest.asymmetricMatcher'), sample, toString: () => 'ArrayContaining' })
        const items = Array.from({ length: 60 }, (_, i) => i)
        expect(mod.shortCopy(matcher(items))).toBe(`[Matcher ArrayContaining ${JSON.stringify([...items.slice(0, 50), '… [10 more]'])}]`)
        let reads = 0
        const sample = {}
        for (let i = 0; i < 1000; i++) {
            Object.defineProperty(sample, `k${i}`, { enumerable: true, get: () => ++reads })
        }
        mod.shortCopy(matcher(sample))
        expect(reads).toBe(50)
    })

    it('gives an element list its query and its number of elements', () => {
        const list = kind.setWdioKind(Object.assign([{}, {}, {}], { selector: 'li' }), 'element-array')
        expect(mod.shortCopy(list)).toEqual({ wdio: 'element-array', query: [{ selector: 'li' }], length: 3 })
    })

    it('keeps a shared value that is not a cycle', () => {
        const shared = { x: 1 }
        expect(mod.shortCopy([shared, shared])).toEqual([{ x: 1 }, { x: 1 }])
    })

    it('keeps at most 50 items of an array', () => {
        const items = Array.from({ length: 60 }, (_, i) => i)
        expect(mod.shortCopy(items)).toEqual([...items.slice(0, 50), '… [10 more]'])
        expect(mod.shortCopy(items.slice(0, 50))).toEqual(items.slice(0, 50))
    })

    it('keeps at most 50 keys of an object', () => {
        const entries = Array.from({ length: 60 }, (_, i) => [`k${i}`, i])
        expect(mod.shortCopy(Object.fromEntries(entries))).toEqual({ ...Object.fromEntries(entries.slice(0, 50)), '…': '[10 more]' })
        expect(mod.shortCopy(Object.fromEntries(entries.slice(0, 50)))).toEqual(Object.fromEntries(entries.slice(0, 50)))
    })

    it('reads only the 50 values that it keeps of a large object', () => {
        let reads = 0
        const large: Record<string, number> = {}
        for (let i = 0; i < 100_000; i++) {
            Object.defineProperty(large, `k${i}`, { enumerable: true, get: () => ++reads })
        }
        const copy = mod.shortCopy(large) as Record<string, unknown>
        expect(reads).toBe(50)
        expect(Object.keys(copy)).toHaveLength(51)
        expect(copy['…']).toBe('[99950 more]')
    })

    it('copies at most 1000 values of a wide object', () => {
        const row = Array.from({ length: 50 }, (_, i) => i)
        const wide = Array(50).fill(Array(50).fill(Array(50).fill(row)))
        const copy = mod.shortCopy(wide)
        const json = JSON.stringify(copy)
        expect(json.match(/\d+(?=[,\]])/g)!.length).toBeLessThanOrEqual(1000)
        expect(json.length).toBeLessThan(10_000)
        expect((copy as unknown[]).at(-1)).toBe('… [49 more]')
    })

    it('keeps at most 4 levels', () => {
        expect(mod.shortCopy({ a: { b: { c: { d: { e: 1 } } } } })).toEqual({ a: { b: { c: { d: '[…]' } } } })
        expect(mod.shortCopy([[[[[1]]]]])).toEqual([[[['[…]']]]])
        expect(mod.shortCopy({ a: { b: { c: { d: 1 } } } })).toEqual({ a: { b: { c: { d: 1 } } } })
    })

    it('gives a label for a Map and a Set', () => {
        expect(mod.shortCopy(new Map([['a', 1], ['b', 2]]))).toBe('Map(2)')
        expect(mod.shortCopy(new Set([1, 2, 3]))).toBe('Set(3)')
        expect(mod.shortCopy({ list: new Set() })).toEqual({ list: 'Set(0)' })
    })

    it('gives a label for binary data', () => {
        expect(mod.shortCopy(new ArrayBuffer(8))).toBe('<ArrayBuffer 8 bytes>')
        expect(mod.shortCopy(new Uint16Array(4))).toBe('<Uint16Array 8 bytes>')
        expect(mod.shortCopy(new Float32Array(2))).toBe('<Float32Array 8 bytes>')
        expect(mod.shortCopy(new DataView(new ArrayBuffer(3)))).toBe('<DataView 3 bytes>')
        expect(mod.shortCopy(Buffer.alloc(2))).toBe('<Buffer 2 bytes>')
    })

    describe('placeholders of the command log', () => {
        const screenshot = Buffer.alloc(1500).toString('base64')

        it('gives the screenshot placeholder for a base64 file', async () => {
            const { transformCommandLogResult } = await import('../src/utils.js')
            expect(screenshot).toHaveLength(2000)
            expect(mod.shortCopy({ file: screenshot })).toBe('"<Screenshot[base64]>"')
            expect(mod.shortCopy({ file: screenshot })).toBe(transformCommandLogResult({ file: screenshot }))
            expect(mod.shortCopy({ a: { file: screenshot } })).toEqual({ a: '"<Screenshot[base64]>"' })
            expect(mod.shortCopy([{ file: screenshot }])).toEqual(['"<Screenshot[base64]>"'])
        })

        it('gives the script placeholders of the log', async () => {
            const { transformCommandLogResult } = await import('../src/utils.js')
            const named = 'return (function myScript () { return 1 }).apply(null, arguments)'
            const minified = '!function(t,e){return 1}()'
            const base64 = Buffer.from('some script payload').toString('base64')

            expect(mod.shortCopy({ script: named, args: [1] })).toEqual({ script: `myScript(...) [${named.length} bytes]`, args: [1] })
            expect(mod.shortCopy({ script: minified })).toEqual({ script: `<minified function> [${minified.length} bytes]` })
            expect(mod.shortCopy({ script: base64 })).toBe('"<Script[base64]>"')
            expect(mod.shortCopy({ a: { script: named } })).toEqual({ a: { script: `myScript(...) [${named.length} bytes]` } })
            for (const script of [named, minified, base64, 'function myScript () { return 1 }']) {
                expect(mod.shortCopy({ script })).toEqual(transformCommandLogResult({ script }))
            }
        })

        it('keeps the other values', () => {
            expect(mod.shortCopy(undefined)).toBeUndefined()
            expect(mod.shortCopy({ a: undefined })).toEqual({ a: undefined })
            expect(mod.shortCopy(screenshot)).toBe('A'.repeat(1024) + '… [2000 bytes]')
            expect(mod.shortCopy({ file: 'not base64!', script: 'return 1' })).toEqual({ file: 'not base64!', script: 'return 1' })
            expect(mod.shortCopy({ file: screenshot.slice(0, 1200) + '!' })).toEqual({ file: screenshot.slice(0, 1024) + '… [1201 bytes]' })
        })

        it('keeps the limits', () => {
            expect(mod.shortCopy({ a: { b: { c: { d: { file: screenshot } } } } })).toEqual({ a: { b: { c: { d: '[…]' } } } })
            const longScript = 'return (function myScript () {' + ' '.repeat(2000) + '})'
            const extra = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`k${i}`, i]))
            const copy = mod.shortCopy({ script: longScript, ...extra }) as Record<string, unknown>
            expect(copy.script).toBe(`myScript(...) [${longScript.length} bytes]`)
            expect(copy['…']).toBe('[11 more]')
        })

        it('does not use the placeholders for an object that is not plain', () => {
            class Shot { file = screenshot }
            expect(mod.shortCopy(new Shot())).toEqual({ file: 'A'.repeat(1024) + '… [2000 bytes]' })
        })

        it('copies the placeholder in the result of a call', async () => {
            const browser = fakeBrowser()
            await mod.runUserCommand(browser, 'getText', [{ file: screenshot }], async () => ({ file: screenshot }))
            expect(pairs(browser)[0][1].body).toEqual(['"<Screenshot[base64]>"'])
            expect(pairs(browser)[1][1].result.value).toBe('"<Screenshot[base64]>"')
        })
    })

    it('copies the result of a call', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'getText', [], async () => 'a'.repeat(2000))
        expect(pairs(browser)[1][1].result.value).toBe('a'.repeat(1024) + '… [2000 bytes]')
    })
})

describe('values that cannot be copied', () => {
    const unreadable = () => ({ get value () { throw new Error('getter') } })

    it('gives a label for an invalid date', () => {
        expect(mod.shortCopy(new Date(NaN))).toBe('Invalid Date')
        expect(mod.shortCopy(new Date(0))).toBe('1970-01-01T00:00:00.000Z')
    })

    it('gives a placeholder for a value with a getter that throws', () => {
        expect(mod.shortCopy(unreadable())).toBe('<unreadable>')
        expect(mod.userCommandBody(['x', unreadable()])).toEqual(['x', '<unreadable>'])
        const option = { get mask () { throw new Error('getter') } }
        expect(mod.userCommandBody(['secret', option])).toEqual(['<unreadable>', '<unreadable>'])
    })

    it.each([
        ['an invalid date', () => new Date(NaN), 'Invalid Date'],
        ['a getter that throws', unreadable, '<unreadable>']
    ])('runs the command with %s in its arguments', async (_, arg, label) => {
        const browser = fakeBrowser()
        const run = vi.fn(async () => 'done')
        expect(await mod.runUserCommand(browser, 'getText', ['x', arg()], run)).toBe('done')
        expect(run).toHaveBeenCalledTimes(1)
        expect(pairs(browser).map(([, payload]) => payload.body)).toEqual([['x', label], ['x', label]])
    })

    it('keeps the result of a command when its copy fails', async () => {
        const browser = fakeBrowser()
        const result = unreadable()
        expect(await mod.runUserCommand(browser, 'getText', [], async () => result)).toBe(result)
        expect(pairs(browser)[1][1].result).toEqual({ value: '<unreadable>' })

        const syncBrowser = fakeBrowser()
        expect(mod.runCustomCommand(syncBrowser, 'myCmd', [], () => result)).toBe(result)
        expect(pairs(syncBrowser)[1][1].result).toEqual({ value: '<unreadable>' })
    })
})
