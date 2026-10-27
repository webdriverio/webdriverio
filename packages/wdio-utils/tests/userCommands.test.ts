import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
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

function fakeBrowser (props: Record<string, unknown> = {}) {
    return { isBidi: true, options: {}, emit: vi.fn(), ...props } as {
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
    it('sends one userCommand and one userResult with the same id for a depth 0 call', async () => {
        const browser = fakeBrowser()
        expect(await mod.runUserCommand(browser, 'getText', [], async () => 'hello')).toBe('hello')
        expect(pairs(browser)).toEqual([
            ['userCommand', { id: 1, command: 'getText', body: [], protocol: 'bidi' }],
            ['userResult', { id: 1, command: 'getText', body: [], protocol: 'bidi', result: { value: 'hello' } }]
        ])
    })

    it('sends nothing for a nested registered command', async () => {
        const browser = fakeBrowser()
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

    it('sends the error and resets the depth', async () => {
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
        const depths: (number | undefined)[] = []
        const inner: (number | undefined)[] = []
        const call = (ms: number) => mod.runUserCommand(browser, 'getText', [], async () => {
            depths.push(store.getStore()?.depth)
            await new Promise((resolve) => setTimeout(resolve, ms))
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => {
                inner.push(mod.currentUserCommandId())
            })
            return ms
        })
        expect(await Promise.all([call(20), call(5)])).toEqual([20, 5])
        expect(depths).toEqual([0, 0])
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
        const browser = fakeBrowser()
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

    it('sends the events of an element list query', async () => {
        const browser = fakeBrowser()
        let wrapper: ((load: () => Promise<unknown>) => Promise<unknown>) | undefined
        const list = { [shim.ELEMENT_ARRAY_WRAP]: (fn: typeof wrapper) => { wrapper = fn } }
        const query = shim.wrapCommand('$$', () => list)
        expect(query.call(browser, 'a')).toBe(list)
        await wrapper!(async () => [])
        expect(pairs(browser)).toEqual([
            ['userCommand', { id: 1, command: '$$', body: ['a'], protocol: 'bidi' }],
            ['userResult', { id: 1, command: '$$', body: ['a'], protocol: 'bidi', result: { value: [] } }]
        ])
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
        const browser = fakeBrowser()
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

    it('is undefined inside an excluded outer call', async () => {
        const browser = fakeBrowser({ options: { userCommandEvents: { exclude: ['waitUntil'] } } })
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            expect(mod.currentUserCommandId()).toBeUndefined()
            await mod.runUserCommand(browser, 'isDisplayed', [], async () => {
                expect(mod.currentUserCommandId()).toBeUndefined()
            })
        })
        expect(browser.emit).not.toHaveBeenCalled()
    })
    it('is undefined inside a command hook of a nested command', async () => {
        const browser = fakeBrowser()
        const ids: Record<string, number | undefined> = {}
        browser.options = {
            beforeCommand: () => { ids.before = mod.currentUserCommandId() },
            afterCommand: () => { ids.after = mod.currentUserCommandId() }
        }
        const getText = shim.wrapCommand('getText', async () => { ids.command = mod.currentUserCommandId() })
        await mod.runUserCommand(browser, 'waitUntil', [], () => getText.call(browser))
        expect(ids).toEqual({ before: undefined, command: 1, after: undefined })
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
                expect(store.getStore()?.depth).toBeGreaterThanOrEqual(1)
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

describe('runNested', () => {
    it('sends nothing for the commands that a custom command runs', async () => {
        const browser = fakeBrowser()
        await store.run({ depth: 0 }, () => mod.runNested(() => mod.runUserCommand(browser, 'getText', [], async () => 'hello')))
        expect(browser.emit).not.toHaveBeenCalled()
        await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        expect(browser.emit).toHaveBeenCalledTimes(2)
    })

    it('keeps the id of the outer call', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'waitUntil', [], async () => {
            await mod.runNested(async () => {
                expect(store.getStore()?.depth).toBe(1)
                expect(mod.currentUserCommandId()).toBe(1)
            })
        })
    })

    it('adds no frame when there is no outer frame', async () => {
        const browser = fakeBrowser()
        await mod.runNested(async () => {
            expect(store.getStore()).toBeUndefined()
            await mod.runUserCommand(browser, 'getText', [], async () => 'hello')
        })
        expect(browser.emit).toHaveBeenCalledTimes(2)
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

describe('custom commands', () => {
    const EVENTS = ['command', 'result', 'userCommand', 'userResult']

    function client (props: Record<string, PropertyDescriptor> = {}) {
        const browser = monad.default({}, (c: unknown) => c, { isBidi: { value: true }, ...props })('sessionId', shim.wrapCommand) as Record<string, Function>
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
        // the old code sends its error result one tick later than the user result
        expect(names(events)).toEqual([
            ['userCommand', 'myCmd', undefined],
            ['command', 'myCmd', 1],
            ['userResult', 'myCmd', undefined],
            ['result', 'myCmd', 1]
        ])
        expect(events[2][1].result).toEqual({ error: expect.objectContaining({ message: 'boom' }) })
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
        const { browser, events } = client()
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
        expect(mod.shortCopy(kind.setWdioKind({ elementId: 'abc', selector: 'a' }, 'element'))).toBe('WebdriverIO.Element<abc>')
        expect(mod.shortCopy(kind.setWdioKind({ selector: 'a' }, 'element'))).toBe('WebdriverIO.Element<a>')
        expect(mod.shortCopy(kind.setWdioKind({}, 'browser'))).toBe('WebdriverIO.Browser')

        const circular: Record<string, unknown> = { a: 1, list: [Buffer.from('x')] }
        circular.self = circular
        expect(() => mod.shortCopy(circular)).not.toThrow()
        expect(mod.shortCopy(circular)).toEqual({ a: 1, list: ['<Buffer 1 bytes>'], self: '[Circular]' })
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
