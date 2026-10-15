/**
 * What a user and the code of WebdriverIO can see of each item of an element list: its own
 * values, its commands, the command hooks and events, commands added to one item or to the
 * browser, the list commands and multi-remote entries (#16086).
 */
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'
import { getWdioKind } from '@wdio/utils'

import { remote, multiRemote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const requests = () => vi.mocked(fetch).mock.calls.map(([uri, params]) =>
    `${params?.method ?? 'GET'} ${new URL(String(uri)).pathname.replace(/^\/session\/[^/]+/, '')}`)

const session = (options: Record<string, unknown> = {}) => remote({
    baseUrl: 'http://foobar.com',
    capabilities: { browserName: 'foobar' },
    ...options
})

describe('the items of an element list', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('are elements with their own id, index, selector and parent', async () => {
        const browser = await session()
        const list = await browser.$$('#foo')
        expect([...list].map((item) => item.elementId)).toEqual(['some-elem-123', 'some-elem-456', 'some-elem-789'])
        expect([...list].map((item) => item[ELEMENT_KEY])).toEqual(['some-elem-123', 'some-elem-456', 'some-elem-789'])
        expect([...list].map((item) => item.index)).toEqual([0, 1, 2])
        for (const item of list) {
            expect(item.selector).toBe('#foo')
            expect(item.parent).toBe(browser)
            expect(item.strict).toBe(false)
            expect(item.isReactElement).toBe(false)
            expect(item.isShadowElement).toBe(false)
            expect(getWdioKind(item)).toBe('element')
            expect(item.sessionId).toBe(browser.sessionId)
            expect(item.options).toBe(browser.options)
        }
    })

    it('run each command with their own element id', async () => {
        const browser = await session()
        const list = await browser.$$('#foo')
        vi.mocked(fetch).mockClear()
        await Promise.all([...list].map((item) => item.getElementAttribute(item.elementId, 'class')))
        expect(requests().sort()).toEqual([
            'GET /element/some-elem-123/attribute/class',
            'GET /element/some-elem-456/attribute/class',
            'GET /element/some-elem-789/attribute/class'
        ])
    })

    it('have the commands of an element, as functions that can be read and called', async () => {
        const browser = await session()
        const [item] = await browser.$$('#foo')
        for (const name of ['click', 'getText', '$', '$$', 'waitForExist', 'isExisting', 'getElementText', 'addCommand', 'overwriteCommand', 'on', 'once', 'off', 'emit']) {
            expect(typeof (item as unknown as Record<string, unknown>)[name], name).toBe('function')
            expect(name in item, name).toBe(true)
        }
        expect(Object.keys(item)).toEqual(Object.keys((await browser.$$('#foo'))[1]))
    })

    it('run the command hooks the same number of times for every item (one middleware layer each)', async () => {
        const beforeCommand = vi.fn()
        const afterCommand = vi.fn()
        const browser = await session({ beforeCommand: [beforeCommand], afterCommand: [afterCommand] })
        const list = await browser.$$('#foo')
        const hooksOf = async (item: WebdriverIO.Element) => {
            beforeCommand.mockClear()
            afterCommand.mockClear()
            await item.getElementAttribute(item.elementId, 'class')
            return [beforeCommand.mock.calls.map(([name]) => name), afterCommand.mock.calls.length]
        }
        const first = await hooksOf(list[0])
        expect(await hooksOf(list[1])).toEqual(first)
        expect(await hooksOf(list[2])).toEqual(first)
        const single = await browser.$('#foo')
        expect(await hooksOf(single)).toEqual(first)
    })

    it('send their command events to the browser', async () => {
        const browser = await session()
        const list = await browser.$$('#foo')
        const commands: string[] = []
        browser.on('command', ({ command }: { command: string }) => commands.push(command))
        await list[2].getElementAttribute(list[2].elementId, 'class')
        expect(commands).toContain('getElementAttribute')
    })

    it('emit on the object that found them', async () => {
        const browser = await session()
        const [item] = await browser.$$('#foo')
        const onBrowser = vi.fn()
        const onItem = vi.fn()
        browser.on('custom-event', onBrowser)
        item.on('custom-event', onItem)
        item.emit('custom-event', { x: 1 })
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(onBrowser).toHaveBeenCalledWith({ x: 1 })
        expect(onItem).not.toHaveBeenCalled()
    })

    describe('a command added to one item', () => {
        it('with a new name: that item has it, the other items of the list do not, a later list has it', async () => {
            const browser = await session()
            const list = await browser.$$('#foo')
            list[0].addCommand('contractNew', function (this: WebdriverIO.Element) { return `new:${this.elementId}` })
            // @ts-expect-error custom command
            expect(await list[0].contractNew()).toBe('new:some-elem-123')
            expect((list[1] as unknown as Record<string, unknown>).contractNew).toBeUndefined()
            const later = await browser.$$('#foo')
            // @ts-expect-error custom command
            expect(await later[1].contractNew()).toBe('new:some-elem-456')
        })

        it('with the name of an existing command: a later list has it', async () => {
            const browser = await session()
            const list = await browser.$$('#foo')
            list[0].addCommand('getElementAttribute', function () { return 'replaced' })
            const later = await browser.$$('#foo')
            expect(await later[0].getElementAttribute('x', 'y')).toBe('replaced')
            expect(await list[1].getElementAttribute(list[1].elementId, 'class')).not.toBe('replaced')
            /**
             * the item keeps the command that it had, as a single element does
             */
            expect(await list[0].getElementAttribute(list[0].elementId, 'class')).not.toBe('replaced')
            const single = await browser.$('#foo')
            single.addCommand('getElementAttribute', function () { return 'replaced again' })
            expect(await single.getElementAttribute(single.elementId, 'class')).not.toBe('replaced again')
        })

        it('overwritten on one item changes that item only', async () => {
            const browser = await session()
            const list = await browser.$$('#foo')
            list[0].overwriteCommand('getElementAttribute', async function (this: WebdriverIO.Element, orig: Function, ...args: unknown[]) {
                return `over:${await orig(...args)}`
            } as never)
            expect(String(await list[0].getElementAttribute(list[0].elementId, 'class'))).toMatch(/^over:/)
            expect(String(await list[1].getElementAttribute(list[1].elementId, 'class'))).not.toMatch(/^over:/)
        })
    })

    describe('a command added to the browser for elements', () => {
        it('after the list: the items of the list do not have it, a later list has it', async () => {
            const browser = await session()
            const list = await browser.$$('#foo')
            browser.addCommand('contractLater', function (this: WebdriverIO.Element) { return this.elementId }, { attachToElement: true })
            expect((list[0] as unknown as Record<string, unknown>).contractLater).toBeUndefined()
            const later = await browser.$$('#foo')
            // @ts-expect-error custom command
            expect(await later[2].contractLater()).toBe('some-elem-789')
        })

        it('overwritten after the list: the items of the list do not run it, a later list does', async () => {
            const browser = await session()
            const list = await browser.$$('#foo')
            browser.overwriteCommand('getElementAttribute', async function (this: WebdriverIO.Element, orig: Function, ...args: unknown[]) {
                return `over:${await orig(...args)}`
            } as never, { attachToElement: true })
            expect(String(await list[1].getElementAttribute(list[1].elementId, 'class'))).not.toMatch(/^over:/)
            const later = await browser.$$('#foo')
            expect(String(await later[1].getElementAttribute(later[1].elementId, 'class'))).toMatch(/^over:/)
        })

        it('overwritten before the list: every item runs the overwrite once', async () => {
            const browser = await session()
            const overwrite = vi.fn(async function (this: WebdriverIO.Element, orig: Function, ...args: unknown[]) {
                return orig(...args)
            })
            browser.overwriteCommand('getElementAttribute', overwrite as never, { attachToElement: true })
            const list = await browser.$$('#foo')
            for (const item of list) {
                overwrite.mockClear()
                await item.getElementAttribute(item.elementId, 'class')
                expect(overwrite).toHaveBeenCalledTimes(1)
                expect(overwrite.mock.contexts[0]).toBe(item)
            }
        })
    })

    it('go into a script as element references', async () => {
        const browser = await session()
        const list = await browser.$$('#foo')
        vi.mocked(fetch).mockClear()
        await browser.execute((a: unknown, b: unknown) => [a, b], list[1], list[2]).catch(() => {})
        const body = JSON.parse(String(vi.mocked(fetch).mock.calls.find(([uri]) => String(uri).includes('/execute'))?.[1]?.body))
        expect(body.args).toEqual([{ [ELEMENT_KEY]: 'some-elem-456' }, { [ELEMENT_KEY]: 'some-elem-789' }])
    })

    it('of a list of elements keep the elements as they are', async () => {
        const browser = await session()
        const found = await browser.$$('#foo')
        const list = await browser.$$(found as unknown as WebdriverIO.Element[])
        expect(list[1]).toBe(found[1])
    })

    it('of an element list have the element as parent', async () => {
        const browser = await session()
        const parent = await browser.$('#foo')
        const list = await parent.$$('.bar')
        expect(list.length).toBeGreaterThan(0)
        for (const item of list) {
            expect(item.parent).toBe(parent)
        }
    })

    it('of react$$ keep the react flags', async () => {
        const browser = await session()
        const list = await browser.react$$('myComp', { props: { a: 1 } })
        expect(list.length).toBe(3)
        for (const item of list) {
            expect(item.isReactElement).toBe(true)
            expect(item.parent).toBe(browser)
        }
    })

    it('of custom$$ keep the strategy', async () => {
        const browser = await session()
        browser.addLocatorStrategy('contract', (selector: string, root: unknown) => [
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-a-${root}` },
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-b-${root}` }
        ] as unknown as HTMLElement[])
        const parent = await browser.$('#foo')
        const list = await parent.custom$$('contract', '.x')
        expect([...list].map((item) => item.elementId)).toEqual(['.x-a-some-elem-123', '.x-b-some-elem-123'])
        for (const item of list) {
            expect((item.selector as unknown as { strategyName: string }).strategyName).toBe('contract')
            expect(item.parent).toBe(parent)
        }
    })

    it('of shadow$$ keep the shadow flag', async () => {
        const browser = await session()
        const host = await browser.$('#foo')
        const list = await host.shadow$$('.bar')
        expect(list.length).toBeGreaterThan(0)
        for (const item of list) {
            expect(item.isShadowElement).toBe(true)
        }
    })
})

describe('the entries of a multi-remote list', () => {
    const caps = () => ({
        browserA: { capabilities: { browserName: 'chrome' } },
        browserB: { port: 4445, capabilities: { browserName: 'firefox' } }
    })

    it('have the instances, their elements, and run a command in each instance', async () => {
        const browser = await multiRemote(caps())
        const list = await browser.$$('#foo')
        expect(list).toHaveLength(3)
        for (const [i, entry] of [...list].entries()) {
            expect(entry.isMultiRemote).toBe(true)
            expect([...entry.instances].sort()).toEqual(['browserA', 'browserB'])
            expect(entry.selector).toBe('#foo')
            expect(entry.getInstance('browserA').elementId).toBe(['some-elem-123', 'some-elem-456', 'some-elem-789'][i])
            expect(getWdioKind(entry)).toBe('element')
        }
        vi.mocked(fetch).mockClear()
        await list[1].getAttribute('class')
        expect(requests().filter((r) => r.includes('/attribute/class')).sort()).toEqual([
            'GET /element/some-elem-456/attribute/class',
            'GET /element/some-elem-456/attribute/class'
        ])
    })

    it('select an instance of each entry, without a change to the other entries', async () => {
        const browser = await multiRemote(caps())
        const list = await browser.$$('#foo')
        const onlyA = list[2].select('browserA')
        expect(onlyA.instances).toEqual(['browserA'])
        expect(onlyA.getInstance('browserA').elementId).toBe('some-elem-789')
        expect([...list[2].instances].sort()).toEqual(['browserA', 'browserB'])
        expect([...list[0].instances].sort()).toEqual(['browserA', 'browserB'])
    })

    it('have a command that the browser added for elements before the list, in each instance', async () => {
        const browser = await multiRemote(caps())
        browser.addCommand('contractEntry', function () { return 'entry' }, { attachToElement: true })
        const list = await browser.$$('#foo')
        // @ts-expect-error custom command
        expect(await list[1].contractEntry()).toEqual(['entry', 'entry'])
    })

    it('run an overwrite that the browser added for elements before the list, once per instance', async () => {
        const browser = await multiRemote(caps())
        const overwrite = vi.fn(async function (this: unknown, orig: Function, ...args: unknown[]) { return orig(...args) })
        browser.overwriteCommand('getAttribute', overwrite as never, { attachToElement: true })
        const list = await browser.$$('#foo')
        for (const entry of [list[2], list[0]]) {
            overwrite.mockClear()
            await entry.getAttribute('class')
            expect(overwrite).toHaveBeenCalledTimes(2)
        }
    })

    it('have their own getInstance', async () => {
        const browser = await multiRemote(caps())
        const list = await browser.$$('#foo')
        expect(list[0].getInstance('browserB')).not.toBe(list[1].getInstance('browserB'))
        expect(list[0].getInstance('browserB').elementId).toBe('some-elem-123')
        expect(list[1].getInstance('browserB').elementId).toBe('some-elem-456')
    })
})
