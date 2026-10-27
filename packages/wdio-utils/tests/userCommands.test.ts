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
        await mod.runNested(() => mod.runUserCommand(browser, 'getText', [], async () => 'hello'))
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

    it('is used by a custom command of the monad', async () => {
        const browser = fakeBrowser()
        const client = monad.default({}, (c: unknown) => c, {})('sessionId') as Record<string, Function>
        client.addCommand('myCommand', () => mod.runUserCommand(browser, 'getText', [], async () => 'hello'))
        expect(await client.myCommand()).toBe('hello')
        expect(browser.emit).not.toHaveBeenCalled()
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
        expect(mod.shortCopy(new Uint8Array(5))).toBe('<Buffer 5 bytes>')

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

    it('copies the result of a call', async () => {
        const browser = fakeBrowser()
        await mod.runUserCommand(browser, 'getText', [], async () => 'a'.repeat(2000))
        expect(pairs(browser)[1][1].result.value).toBe('a'.repeat(1024) + '… [2000 bytes]')
    })
})
