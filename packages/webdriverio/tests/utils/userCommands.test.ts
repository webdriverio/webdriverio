import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { registerUserCommands } from '@wdio/utils'
import type * as Utils from '@wdio/utils'

import { remote } from '../../src/node.js'
import { getContextManager } from '../../src/session/context.js'
import { getPrototype } from '../../src/utils/index.js'
import { getBrowsingContext } from '../../src/browsingContext.js'
import { applyBidiBrowserOverwrites } from '../../src/utils/bidi/browserOverwrites.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/utils', async (importOriginal) => {
    const utils = await importOriginal<typeof Utils>()
    return { ...utils, registerUserCommands: vi.fn(utils.registerUserCommands) }
})

interface UserCommandEvent { id: number, command: string, body: unknown[], protocol: string, result?: unknown }

async function bidiSession () {
    const browser = await remote({ capabilities: { browserName: 'bidi' } })
    // a BiDi session without `wdio:experimentalBiDiCommands` sends user commands only with the option
    browser.options.userCommandEvents = true
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

    it('sends nothing in a BiDi session without the option and without wdio:experimentalBiDiCommands', async () => {
        const browser = await bidiSession()
        delete browser.options.userCommandEvents
        const events = recordEvents(browser)
        await browser.url('https://example.com')
        expect(events).toEqual([])
        browser.options.userCommandEvents = true
        await browser.url('https://example.com')
        expect(commandsOf(events)).toEqual([['userCommand', 'url'], ['userResult', 'url']])
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

    it('sends no pair for an excluded waitUntil, and its polls get its id as parent', async () => {
        const browser = await bidiSession()
        browser.options.userCommandEvents = { exclude: ['waitUntil'] }
        const events = recordEvents(browser)
        const protocol: [string, string, number | undefined][] = []
        browser.on('command', (payload) => protocol.push(['command', payload.command, payload.parent]))
        browser.on('result', (payload) => protocol.push(['result', payload.command, payload.parent]))
        let polls = 0
        await browser.waitUntil(async () => Boolean(await browser.getTitle()) && ++polls === 3, { interval: 1 })
        expect(events).toEqual([])
        expect(protocol).toHaveLength(6)
        const parents = new Set(protocol.map(([, , parent]) => parent))
        expect(parents.size).toBe(1)
        expect([...parents][0]).toEqual(expect.any(Number))

        // the next user command sends its pair, and its protocol commands get its own id
        protocol.length = 0
        await browser.getTitle().then(() => browser.url('https://example.com'))
        expect(commandsOf(events)).toEqual([['userCommand', 'url'], ['userResult', 'url']])
        expect(protocol.map(([event, command, parent]) => [event, command, parent === undefined])).toEqual([
            ['command', 'getTitle', true],
            ['result', 'getTitle', true]
        ])
    })

    it('gives no parent to the screenshot of a protocol takeScreenshot inside a user command', async () => {
        const browser = await bidiSession()
        browser.addCommand('shot', async function (this: WebdriverIO.Browser) {
            return this.takeScreenshot()
        })
        const events = recordEvents(browser)
        const protocol: [string, string, string | undefined, number | undefined][] = []
        browser.on('command', (payload) => protocol.push(['command', payload.command, payload.endpoint, payload.parent]))
        browser.on('result', (payload) => protocol.push(['result', payload.command, payload.endpoint, payload.parent]))
        await (browser as unknown as { shot(): Promise<string> }).shot()
        expect(commandsOf(events)).toEqual([['userCommand', 'shot'], ['userResult', 'shot']])
        expect(protocol.filter(([, command]) => command === 'takeScreenshot')).toEqual([
            ['command', 'takeScreenshot', '/session/:sessionId/screenshot', undefined],
            ['result', 'takeScreenshot', '/session/:sessionId/screenshot', undefined]
        ])
    })

    it('gives no parent to the screenshot of the BiDi takeScreenshot overwrite inside a user command', async () => {
        const browser = await bidiSession()
        ;(browser as unknown as { __bidiCommandsEnabled: boolean }).__bidiCommandsEnabled = true
        vi.spyOn(getContextManager(browser), 'getCurrentTopLevelContext').mockResolvedValue('top-context')
        vi.spyOn(browser, 'browsingContextCaptureScreenshot').mockResolvedValue({ data: 'iVBORw0KGgo=' })
        // the overwrites are off in unit tests
        const unitTests = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        try {
            applyBidiBrowserOverwrites(browser)
        } finally {
            process.env.WDIO_UNIT_TESTS = unitTests
        }
        browser.addCommand('shot', async function (this: WebdriverIO.Browser) {
            return this.takeScreenshot()
        })
        const protocol: [string, string, number | undefined][] = []
        browser.on('command', (payload) => protocol.push(['command', payload.command, payload.parent]))
        browser.on('result', (payload) => protocol.push(['result', payload.command, payload.parent]))
        recordEvents(browser)
        expect(await (browser as unknown as { shot(): Promise<string> }).shot()).toBe('iVBORw0KGgo=')
        expect(protocol.filter(([, command]) => command === 'takeScreenshot')).toEqual([
            ['command', 'takeScreenshot', undefined],
            ['result', 'takeScreenshot', undefined]
        ])
        // the old events of the custom command keep its id
        expect(protocol.filter(([, command]) => command === 'shot').map(([, , parent]) => parent)).toEqual([expect.any(Number), expect.any(Number)])
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

describe('user command events of a browsing context', () => {
    const topContext = (browser: WebdriverIO.Browser) => getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' }) as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>

    it('sends one pair for a custom command of a context, and its commands are nested', async () => {
        const browser = await bidiSession()
        browser.addCommand('login', async function (this: WebdriverIO.BrowsingContext) {
            await this.pause(1)
            await this.pause(2)
            return 'ok'
        }, { attachToBrowsingContext: true })
        const page = topContext(browser)
        // a custom command added after the context was made
        browser.addCommand('logout', async function (this: WebdriverIO.BrowsingContext) {
            await this.pause(1)
        }, { attachToBrowsingContext: true })
        const events = recordEvents(browser)
        expect(await page.login()).toBe('ok')
        await page.logout()
        await topContext(browser).logout()
        expect(commandsOf(events)).toEqual([
            ['userCommand', 'login'],
            ['userResult', 'login'],
            ['userCommand', 'logout'],
            ['userResult', 'logout'],
            ['userCommand', 'logout'],
            ['userResult', 'logout']
        ])
        expect(events[1][1].result).toEqual({ value: 'ok' })
    })

    it('sends one pair with the name of an overwritten context command', async () => {
        const browser = await bidiSession()
        browser.overwriteCommand('getUrl', async function (this: WebdriverIO.BrowsingContext, origGetUrl: () => Promise<string>) {
            return `${await origGetUrl()}#x`
        }, { attachToBrowsingContext: true })
        vi.spyOn(browser, 'scriptCallFunction').mockResolvedValue({ type: 'success', realm: 'realm-1', result: { type: 'string', value: 'https://example.com/' } } as never)
        const events = recordEvents(browser)
        expect(await topContext(browser).getUrl()).toBe('https://example.com/#x')
        expect(commandsOf(events)).toEqual([['userCommand', 'getUrl'], ['userResult', 'getUrl']])
    })

    it('sends one pair with the name of a built-in context command', async () => {
        const browser = await bidiSession()
        const page = topContext(browser)
        vi.spyOn(browser, 'scriptCallFunction').mockResolvedValue({ type: 'success', realm: 'realm-1', result: { type: 'string', value: 'Title' } } as never)
        const events = recordEvents(browser)
        expect(await page.getTitle()).toBe('Title')
        await page.navigate('https://example.com/x')
        await page.pause(1)
        expect(commandsOf(events)).toEqual([
            ['userCommand', 'getTitle'],
            ['userResult', 'getTitle'],
            ['userCommand', 'navigate'],
            ['userResult', 'navigate'],
            ['userCommand', 'pause'],
            ['userResult', 'pause']
        ])
        expect(events[2][1].body).toEqual(['https://example.com/x'])
    })

    it('runs the command hooks of $$ of a context, and loads the list when it is awaited', async () => {
        const calls: string[] = []
        const browser = await remote({
            capabilities: { browserName: 'bidi' },
            beforeCommand: [(name: string) => { calls.push(`before ${name}`) }],
            afterCommand: [(name: string) => { calls.push(`after ${name}`) }]
        })
        browser.options.userCommandEvents = true
        vi.spyOn(getContextManager(browser), 'getCurrentContext').mockResolvedValue('top-context')
        vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue(undefined as never)
        const events = recordEvents(browser)
        const page = topContext(browser)
        calls.length = 0
        const list = page.$$('#foo')
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(calls).toEqual([])
        await list
        expect([calls[0], calls.at(-1)]).toEqual(['before $$', 'after $$'])
        expect(commandsOf(events)).toEqual([['userCommand', '$$'], ['userResult', '$$']])
    })

    it('sends one action pair for perform of a context', async () => {
        const browser = await bidiSession()
        for (const command of ['inputPerformActions', 'inputReleaseActions'] as const) {
            vi.spyOn(browser, command).mockResolvedValue(undefined as never)
        }
        const page = topContext(browser) as unknown as WebdriverIO.Browser
        const events = recordEvents(browser)
        await page.action('key').down('a').up('a').perform()
        await page.actions([page.action('key').down('b')])
        expect(commandsOf(events)).toEqual([
            ['userCommand', 'action'],
            ['userResult', 'action'],
            ['userCommand', 'actions'],
            ['userResult', 'actions']
        ])
        expect(events[0][1].body).toEqual([['keyDown', 'keyUp']])
    })

    it('keeps the protocol commands of the browser as they are', async () => {
        const browser = await bidiSession()
        topContext(browser)
        const events = recordEvents(browser)
        expect(typeof await browser.getTitle()).toBe('string')
        expect(events).toEqual([])
    })
})
