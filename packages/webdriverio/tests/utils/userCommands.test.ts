import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { registerUserCommands } from '@wdio/utils'
import type * as Utils from '@wdio/utils'

import { remote } from '../../src/node.js'
import { getContextManager } from '../../src/session/context.js'
import { getPrototype } from '../../src/utils/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/utils', async (importOriginal) => {
    const utils = await importOriginal<typeof Utils>()
    return { ...utils, registerUserCommands: vi.fn(utils.registerUserCommands) }
})

interface UserCommandEvent { id: number, command: string, body: unknown[], protocol: string, result?: unknown }

async function bidiSession () {
    const browser = await remote({ capabilities: { browserName: 'bidi' } })
    vi.spyOn(getContextManager(browser), 'getCurrentContext').mockResolvedValue('top-context')
    vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue(undefined as never)
    vi.spyOn(browser, 'browsingContextNavigate').mockResolvedValue({ navigation: null, url: 'https://example.com/' } as never)
    vi.spyOn(browser, 'scriptCallFunction').mockResolvedValue({
        type: 'success',
        realm: 'realm-1',
        result: { type: 'number', value: 1 }
    } as never)
    return browser
}

function recordEvents (browser: WebdriverIO.Browser) {
    const events: [string, UserCommandEvent][] = []
    browser.on('userCommand' as never, (payload: UserCommandEvent) => events.push(['userCommand', payload]))
    browser.on('userResult' as never, (payload: UserCommandEvent) => events.push(['userResult', payload]))
    return events
}

const commandsOf = (events: [string, UserCommandEvent][]) => events.map(([event, payload]) => [event, payload.command])

describe('user command events', () => {
    it('registers the webdriverio commands, not the protocol commands', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        // the element commands are registered with the first element
        await browser.$('#foo')
        const names = new Set(vi.mocked(registerUserCommands).mock.calls.flatMap(([commands]) => commands))
        expect(['saveScreenshot', 'url', '$', 'action', 'getText'].filter((name) => !names.has(name))).toEqual([])
        expect(['takeScreenshot', 'navigateTo', 'SESSION_MOCKS', 'CDP_SESSIONS'].filter((name) => names.has(name))).toEqual([])
    })

    it('registers the commands of a scope once', () => {
        getPrototype('browser')
        getPrototype('element')
        vi.mocked(registerUserCommands).mockClear()
        getPrototype('browser')
        getPrototype('element')
        expect(registerUserCommands).not.toHaveBeenCalled()
    })

    it('sends a pair for url and for $ called from a test', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        await browser.url('https://example.com')
        await browser.$('#foo')
        expect(commandsOf(events)).toEqual([
            ['userCommand', 'url'],
            ['userResult', 'url'],
            ['userCommand', '$'],
            ['userResult', '$']
        ])
        expect(events[0][1]).toEqual({ id: expect.any(Number), command: 'url', body: ['https://example.com'], protocol: 'bidi', sessionId: 'foobar-123' })
        expect(events[2][1].body).toEqual(['#foo'])
        expect(events[1][1].id).toBe(events[0][1].id)
        expect(events[3][1].id).toBe(events[2][1].id)
    })

    it('sends one action pair with the action types for perform', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        await browser.action('pointer').move({ x: 1, y: 2 }).down().up().perform()
        const event = { id: expect.any(Number), command: 'action', body: [['pointerMove', 'pointerDown', 'pointerUp']], protocol: 'bidi', sessionId: 'foobar-123' }
        expect(events).toEqual([
            ['userCommand', event],
            ['userResult', { ...event, result: { value: undefined } }]
        ])
    })

    it('sends the error of a perform that fails', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        const error = new Error('no such window')
        vi.spyOn(browser, 'performActions').mockRejectedValue(error)
        await expect(browser.action('key').down('a').perform()).rejects.toBe(error)
        const event = { id: expect.any(Number), command: 'action', body: [['keyDown']], protocol: 'bidi', sessionId: 'foobar-123' }
        expect(events).toEqual([
            ['userCommand', event],
            ['userResult', { ...event, result: { error } }]
        ])
    })

    it('sends nothing for perform in a Classic session', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const events = recordEvents(browser)
        await browser.action('pointer').move({ x: 1, y: 2 }).down().up().perform()
        await browser.url('https://example.com')
        expect(events).toEqual([])
    })

    it('sends one actions pair with the action types of each builder', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        await browser.actions([
            browser.action('pointer').move({ x: 1, y: 2 }).down(),
            browser.action('key').down('a').up('a')
        ])
        const event = { id: expect.any(Number), command: 'actions', body: [[['pointerMove', 'pointerDown'], ['keyDown', 'keyUp']]], protocol: 'bidi', sessionId: 'foobar-123' }
        expect(events).toEqual([
            ['userCommand', event],
            ['userResult', { ...event, result: { value: undefined } }]
        ])
    })

    it('sends no actions pair inside another user command', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        await browser.waitUntil(async () => {
            await browser.actions([browser.action('key').down('a').up('a')])
            return true
        })
        expect(commandsOf(events)).toEqual([
            ['userCommand', 'waitUntil'],
            ['userResult', 'waitUntil']
        ])
    })

    it('sends no action pair for a perform inside another user command', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        await browser.waitUntil(async () => {
            await browser.action('key').down('a').up('a').perform()
            return true
        })
        expect(commandsOf(events)).toEqual([
            ['userCommand', 'waitUntil'],
            ['userResult', 'waitUntil']
        ])
    })

    it('sends nothing for actions in a Classic session', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const events = recordEvents(browser)
        await browser.actions([browser.action('key').down('a').up('a')])
        expect(events).toEqual([])
    })

    it('sends no call pair, and the commands in call send their own pairs', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        await browser.call(async () => browser.$('#foo').getText())
        expect(commandsOf(events)).toEqual([
            ['userCommand', '$'],
            ['userResult', '$'],
            ['userCommand', 'getText'],
            ['userResult', 'getText']
        ])
    })

    it('sends no call pair for an overwritten call', async () => {
        const browser = await bidiSession()
        browser.overwriteCommand('call', async (origCall, fn) => origCall(fn))
        const events = recordEvents(browser)
        await browser.call(async () => browser.$('#foo').getText())
        expect(commandsOf(events)).toEqual([
            ['userCommand', '$'],
            ['userResult', '$'],
            ['userCommand', 'getText'],
            ['userResult', 'getText']
        ])
    })

    it('sends the name of the function that execute runs', async () => {
        const browser = await bidiSession()
        const events = recordEvents(browser)
        await browser.execute(() => 1)
        expect(events.map(([event, payload]) => [event, payload.command, payload.body])).toEqual([
            ['userCommand', 'execute', ['[Function anonymous]']],
            ['userResult', 'execute', ['[Function anonymous]']]
        ])
    })
})
