import path from 'node:path'

import { describe, it, expect, vi } from 'vitest'
import { remote } from '../src/index.js'
import type { ChainablePromiseElement } from '../src/types.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type Call = [phase: string, name: string, args: unknown[]]

const session = async () => {
    const calls: Call[] = []
    const plain = (args: unknown[]) => args.map((arg) => typeof arg === 'function' ? '<fn>' : arg)
    const browser = await remote({
        baseUrl: 'http://foobar.com',
        capabilities: { browserName: 'foobar' },
        beforeCommand: [(name: string, args: unknown[]) => { calls.push(['before', name, plain(args)]) }],
        afterCommand: [(name: string, args: unknown[]) => { calls.push(['after', name, plain(args)]) }]
    })
    const of = (...names: string[]) => calls.filter(([, name]) => names.includes(name))
    return { browser, calls, of, reset: () => { calls.length = 0 } }
}

/**
 * A command that the user overwrites, and a query chained on a promise, run the
 * hooks once, with the arguments of the call (#16096 follow-ups a and b)
 */
describe('command hooks of overwritten commands', () => {
    it('of a browser command, once, without the original command as argument', async () => {
        const { browser, of, reset } = await session()
        browser.overwriteCommand('getTitle', async function (origCommand) {
            return origCommand()
        })
        reset()
        await browser.getTitle()
        expect(of('getTitle')).toEqual([['before', 'getTitle', []], ['after', 'getTitle', []]])
    })

    it('of a browser command overwritten twice', async () => {
        const { browser, of, reset } = await session()
        browser.overwriteCommand('getTitle', async function (origCommand) {
            return origCommand()
        })
        browser.overwriteCommand('getTitle', async function (origCommand) {
            return (await origCommand()) + '!'
        })
        reset()
        await browser.getTitle()
        expect(of('getTitle')).toEqual([['before', 'getTitle', []], ['after', 'getTitle', []]])
    })

    it('of a browser command whose override calls the original twice', async () => {
        const { browser, of, reset } = await session()
        browser.overwriteCommand('getUrl', async function (origCommand) {
            await origCommand()
            return origCommand()
        })
        reset()
        await browser.getUrl()
        expect(of('getUrl')).toEqual([['before', 'getUrl', []], ['after', 'getUrl', []]])
    })

    it('of $ on the browser, as the Appium selector optimizer does', async () => {
        const { browser, of, reset } = await session()
        browser.overwriteCommand('$', async function (origCommand, selector) {
            return origCommand(selector)
        })
        reset()
        const elem = await browser.$('.foo')
        expect(elem.elementId).toBe('some-elem-123')
        expect(of('$')).toEqual([['before', '$', ['.foo']], ['after', '$', ['.foo']]])
    })

    // the original of a query still chains, as before: only its hooks are left out
    it('of $ whose result is chained with a command', async () => {
        const { browser, of, reset } = await session()
        const expected = await browser.$('.foo').getText()
        browser.overwriteCommand('$', function (origCommand, selector) {
            return origCommand(selector)
        })
        browser.addCommand('textOf', function (this: WebdriverIO.Browser, selector: string) {
            return this.$(selector).getText()
        })
        reset()
        // @ts-expect-error custom command
        expect(await browser.textOf('.foo')).toEqual(expected)
        expect(of('$')).toEqual([['before', '$', ['.foo']], ['after', '$', ['.foo']]])
    })

    it('of $ whose override calls a command on the original without await', async () => {
        const { browser, of, reset } = await session()
        browser.overwriteCommand('$', function (origCommand: (selector: string) => ChainablePromiseElement, selector: string) {
            return origCommand(selector).getElement()
        })
        reset()
        const elem = await browser.$('.foo')
        expect(elem.elementId).toBe('some-elem-123')
        expect(of('$')).toEqual([['before', '$', ['.foo']], ['after', '$', ['.foo']]])
    })

    it('of $$ on the browser, as the Appium selector optimizer does', async () => {
        const { browser, of, reset } = await session()
        browser.overwriteCommand('$$', async function (origCommand, selector) {
            return origCommand(selector)
        })
        reset()
        const list = await browser.$$('.foo')
        expect(list.length).toBeGreaterThan(0)
        expect(of('$$')).toEqual([['before', '$$', ['.foo']], ['after', '$$', ['.foo']]])
    })

    it('of a command overwritten on one element', async () => {
        const { browser, of, reset } = await session()
        const elem = await browser.$('.foo')
        elem.overwriteCommand('getTagName', function (origCommand) {
            return origCommand()
        })
        reset()
        await elem.getTagName()
        expect(of('getTagName')).toEqual([['before', 'getTagName', []], ['after', 'getTagName', []]])
    })

    it('of a custom element command that calls an overwritten command twice', async () => {
        const { browser, of, reset } = await session()
        const elem = await browser.$('.foo')
        elem.overwriteCommand('getTagName', function (origCommand) {
            return origCommand()
        })
        elem.addCommand('tagTwice', async function (this: WebdriverIO.Element) {
            return (await this.getTagName()) + (await this.getTagName())
        })
        reset()
        // @ts-expect-error custom command
        await elem.tagTwice()
        expect(of('tagTwice', 'getTagName').map(([phase, name]) => `${phase} ${name}`)).toEqual([
            'before tagTwice', 'before getTagName', 'after getTagName', 'before getTagName', 'after getTagName', 'after tagTwice'
        ])
    })

    describe('of an element command overwritten with attachToElement', () => {
        it('once, with the arguments of the call', async () => {
            const { browser, of, reset } = await session()
            browser.overwriteCommand('getText', async function (origCommand) {
                return origCommand()
            }, { attachToElement: true })
            const elem = await browser.$('.foo')
            reset()
            await elem.getText()
            expect(of('getText')).toEqual([['before', 'getText', []], ['after', 'getText', []]])
            expect(of('getElementText')).toHaveLength(2)
        })

        it('overwritten twice', async () => {
            const { browser, of, reset } = await session()
            browser.overwriteCommand('getText', async function (origCommand) {
                return origCommand()
            }, { attachToElement: true })
            browser.overwriteCommand('getText', async function (origCommand) {
                return (await origCommand()) + '!'
            }, { attachToElement: true })
            const elem = await browser.$('.foo')
            reset()
            await elem.getText()
            expect(of('getText')).toEqual([['before', 'getText', []], ['after', 'getText', []]])
        })

        it('with an override that does not call the original', async () => {
            const { browser, of, reset } = await session()
            browser.overwriteCommand('getValue', async function () {
                return 'replaced'
            }, { attachToElement: true })
            const elem = await browser.$('.foo')
            reset()
            expect(await elem.getValue()).toBe('replaced')
            expect(of('getValue')).toEqual([['before', 'getValue', []], ['after', 'getValue', []]])
        })

        it('on an item of a list', async () => {
            const { browser, of, reset } = await session()
            browser.overwriteCommand('getText', async function (origCommand) {
                return origCommand()
            }, { attachToElement: true })
            const [item] = await browser.$$('.foo')
            reset()
            await item.getText()
            expect(of('getText')).toEqual([['before', 'getText', []], ['after', 'getText', []]])
        })

        it('of $ on an element whose override calls a command on the original without await', async () => {
            const { browser, of, reset } = await session()
            browser.overwriteCommand('$', function (origCommand: (selector: string) => ChainablePromiseElement, selector: string) {
                return origCommand(selector).getElement()
            }, { attachToElement: true })
            const elem = await browser.$('.foo')
            reset()
            const child = await elem.$('.bar')
            expect(child.elementId).toBeDefined()
            expect(of('$')).toEqual([['before', '$', ['.bar']], ['after', '$', ['.bar']]])
        })

        it('of $$ on an element', async () => {
            const { browser, of, reset } = await session()
            browser.overwriteCommand('$$', async function (origCommand, selector) {
                return origCommand(selector)
            }, { attachToElement: true })
            const elem = await browser.$('.foo')
            reset()
            await elem.$$('.bar')
            expect(of('$$')).toEqual([['before', '$$', ['.bar']], ['after', '$$', ['.bar']]])
        })
    })
})

describe('command hooks of a query chained on a promise', () => {
    it('run once for each query', async () => {
        const { browser, of, reset } = await session()
        reset()
        await browser.$('.foo').$('.bar')
        expect(of('$').filter(([phase]) => phase === 'before')).toEqual([['before', '$', ['.foo']], ['before', '$', ['.bar']]])
    })

    it('run once for each query of a longer chain', async () => {
        const { browser, of, reset } = await session()
        reset()
        await browser.$('.foo').$('.bar').$('.baz')
        expect(of('$').filter(([phase]) => phase === 'before').map(([, , args]) => args)).toEqual([['.foo'], ['.bar'], ['.baz']])
    })

    it('of $$ chained on a promise, once', async () => {
        const { browser, of, reset } = await session()
        reset()
        await browser.$('.foo').$$('.bar')
        expect(of('$$')).toEqual([['before', '$$', ['.bar']], ['after', '$$', ['.bar']]])
    })
})
