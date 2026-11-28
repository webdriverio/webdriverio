/**
 * What a user and the code of WebdriverIO can see of a single element (`$()`, an element that is
 * found again, ...) now that the elements of a browser share their wrapped commands (#16422):
 * commands and overrides that the browser or an element adds before or after, the parent that
 * each element emits on, the hooks, and the descriptors of the browser.
 */
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { remote, multiRemote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const session = (options: Record<string, unknown> = {}) => remote({
    baseUrl: 'http://foobar.com',
    capabilities: { browserName: 'foobar' },
    ...options
})

type Commands = Record<string, unknown>

describe('a single element', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('shares the wrapped commands with the other elements of the browser, also of other parents', async () => {
        const browser = await session()
        const first = await browser.$('#foo')
        const second = await browser.$('#foo')
        const child = await first.$('.bar')
        expect(first).not.toBe(second)
        expect(first.getText).toBe(second.getText)
        expect(child.getText).toBe(first.getText)
        expect(Object.prototype.hasOwnProperty.call(first, 'getText')).toBe(false)
        expect([first.parent, second.parent, child.parent]).toEqual([browser, browser, first])
    })

    it('does not share the commands of another browser', async () => {
        const browserA = await session()
        const browserB = await session()
        browserA.addCommand('onlyA', function () { return 'a' }, { attachToElement: true })
        expect(typeof ((await browserA.$('#foo')) as unknown as Commands).onlyA).toBe('function')
        expect(((await browserB.$('#foo')) as unknown as Commands).onlyA).toBeUndefined()
    })

    describe('a command added to the browser for elements', () => {
        it('after a first element: a later element has it, the first one does not', async () => {
            const browser = await session()
            const first = await browser.$('#foo')
            browser.addCommand('contractLater', function (this: WebdriverIO.Element) { return `later:${this.elementId}` }, { attachToElement: true })
            expect((first as unknown as Commands).contractLater).toBeUndefined()
            const later = await browser.$('#foo')
            // @ts-expect-error custom command
            expect(await later.contractLater()).toBe('later:some-elem-123')
            const child = await later.$('.bar')
            // @ts-expect-error custom command
            expect(await child.contractLater()).toMatch(/^later:/)
        })

        it('with the name of a command it added before: a later element has the new one', async () => {
            const browser = await session()
            browser.addCommand('contractTwice', function () { return 'one' }, { attachToElement: true })
            // @ts-expect-error custom command
            expect(await (await browser.$('#foo')).contractTwice()).toBe('one')
            browser.addCommand('contractTwice', function () { return 'two' }, { attachToElement: true })
            // @ts-expect-error custom command
            expect(await (await browser.$('#foo')).contractTwice()).toBe('two')
        })

        it('overwritten after a first element: a later element runs it once, the first one does not', async () => {
            const browser = await session()
            const first = await browser.$('#foo')
            const overwrite = vi.fn(async function (this: WebdriverIO.Element, orig: Function, ...args: unknown[]) {
                return `over:${await orig(...args)}`
            })
            browser.overwriteCommand('getElementAttribute', overwrite as never, { attachToElement: true })
            expect(String(await first.getElementAttribute(first.elementId, 'class'))).not.toMatch(/^over:/)
            const later = await browser.$('#foo')
            overwrite.mockClear()
            expect(String(await later.getElementAttribute(later.elementId, 'class'))).toMatch(/^over:/)
            expect(overwrite).toHaveBeenCalledTimes(1)
            expect(overwrite.mock.contexts[0]).toBe(later)
        })

        it('overwritten twice: a later element runs both overwrites', async () => {
            const browser = await session()
            await browser.$('#foo')
            browser.overwriteCommand('getElementAttribute', async function (orig: Function, ...args: unknown[]) {
                return `one:${await orig(...args)}`
            } as never, { attachToElement: true })
            await browser.$('#foo')
            browser.overwriteCommand('getElementAttribute', async function (orig: Function, ...args: unknown[]) {
                return `two:${await orig(...args)}`
            } as never, { attachToElement: true })
            const later = await browser.$('#foo')
            expect(String(await later.getElementAttribute(later.elementId, 'class'))).toMatch(/^two:one:/)
        })

        it('in multi-remote, after a first element: a later element has it in each instance', async () => {
            const browser = await multiRemote({
                browserA: { capabilities: { browserName: 'chrome' } },
                browserB: { port: 4445, capabilities: { browserName: 'firefox' } }
            })
            const first = await browser.$('#foo')
            browser.addCommand('contractRemote', function () { return 'remote' }, { attachToElement: true })
            expect((first.getInstance('browserA') as unknown as Commands).contractRemote).toBeUndefined()
            const later = await browser.$('#foo')
            // @ts-expect-error custom command
            expect(await later.contractRemote()).toEqual(['remote', 'remote'])
            // @ts-expect-error custom command
            expect(await later.getInstance('browserB').contractRemote()).toBe('remote')
        })
    })

    describe('a command added to one element', () => {
        it('with a new name: that element has it, an existing element does not, a later element has it', async () => {
            const browser = await session()
            const elem = await browser.$('#foo')
            const other = await browser.$('#foo')
            elem.addCommand('contractNew', function (this: WebdriverIO.Element) { return `new:${this.elementId}` })
            // @ts-expect-error custom command
            expect(await elem.contractNew()).toBe('new:some-elem-123')
            expect((other as unknown as Commands).contractNew).toBeUndefined()
            const later = await browser.$('#foo')
            // @ts-expect-error custom command
            expect(await later.contractNew()).toBe('new:some-elem-123')
        })

        it('with the name of an existing command: the element keeps its command, a later element has the new one', async () => {
            const browser = await session()
            const elem = await browser.$('#foo')
            elem.addCommand('getElementAttribute', function () { return 'replaced' })
            expect(await elem.getElementAttribute(elem.elementId, 'class')).not.toBe('replaced')
            const later = await browser.$('#foo')
            expect(await later.getElementAttribute('x', 'y')).toBe('replaced')
        })

        it('overwritten on one element changes that element only', async () => {
            const browser = await session()
            const elem = await browser.$('#foo')
            const other = await browser.$('#foo')
            elem.overwriteCommand('getElementAttribute', async function (orig: Function, ...args: unknown[]) {
                return `over:${await orig(...args)}`
            } as never)
            expect(String(await elem.getElementAttribute(elem.elementId, 'class'))).toMatch(/^over:/)
            expect(String(await other.getElementAttribute(other.elementId, 'class'))).not.toMatch(/^over:/)
            const later = await browser.$('#foo')
            expect(String(await later.getElementAttribute(later.elementId, 'class'))).not.toMatch(/^over:/)
        })
    })

    it('does not change the descriptors of the browser', async () => {
        const browser = await session()
        browser.addCommand('contractKeep', function () { return 'keep' }, { attachToElement: true })
        const override = async function (orig: Function, ...args: unknown[]) { return orig(...args) }
        browser.overwriteCommand('getElementAttribute', override as never, { attachToElement: true })
        const source = browser.__propertiesObject__
        const before = Object.entries(source).map(([name, descriptor]) => [name, descriptor, { ...descriptor }])
        const overrides = source.__elementOverrides__.value as Record<string, unknown>
        const overridesBefore = { ...overrides }

        const elem = await browser.$('#foo')
        await elem.$('.bar')
        await browser.$$('#foo')
        await (await browser.$('#foo')).getElementAttribute('some-elem-123', 'class')

        expect(browser.__propertiesObject__).toBe(source)
        expect(Object.entries(source).map(([name, descriptor]) => [name, descriptor, { ...descriptor }])).toEqual(before)
        for (const [name, descriptor, copy] of before as [string, PropertyDescriptor, PropertyDescriptor][]) {
            expect(source[name], name).toBe(descriptor)
            expect(source[name].value, name).toBe(copy.value)
        }
        expect(source.__elementOverrides__.value).toBe(overrides)
        expect(overrides).toEqual(overridesBefore)
    })

    it('runs the command hooks once per command, for an element, a later one and an element of an element', async () => {
        const before: string[] = []
        const after: string[] = []
        const browser = await session({
            beforeCommand: [(name: string) => { before.push(name) }],
            afterCommand: [(name: string) => { after.push(name) }]
        })
        const hooksOf = async (elem: WebdriverIO.Element) => {
            before.length = 0
            after.length = 0
            await elem.getText()
            return [[...before], [...after]]
        }
        const expected = [['getText', 'getElementText'], ['getElementText', 'getText']]
        const first = await browser.$('#foo')
        expect(await hooksOf(first)).toEqual(expected)
        expect(await hooksOf(await browser.$('#foo'))).toEqual(expected)
        expect(await hooksOf(await first.$('.bar'))).toEqual(expected)
        // the commands are built again after the browser added one
        browser.addCommand('contractHooks', function () { return 'hooks' }, { attachToElement: true })
        expect(await hooksOf(await browser.$('#foo'))).toEqual(expected)
    })

    it('keeps the options, the session and the flags of its own', async () => {
        const browser = await session()
        const elem = await browser.$('#foo')
        const child = await elem.$('.bar')
        for (const item of [elem, child]) {
            expect(item.options).toBe(browser.options)
            expect(item.sessionId).toBe(browser.sessionId)
            expect(item.isReactElement).toBe(false)
            expect(item.isShadowElement).toBe(false)
            expect(item.index).toBeUndefined()
        }
        expect([elem.selector, child.selector]).toEqual(['#foo', '.bar'])
        expect(elem.elementId).toBe('some-elem-123')
        expect(Object.keys(elem.__propertiesObject__)).toContain('getText')
        expect(elem.__propertiesObject__).not.toBe(browser.__propertiesObject__)
    })
})
