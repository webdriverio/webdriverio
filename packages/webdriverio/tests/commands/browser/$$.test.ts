import path from 'node:path'

import { ELEMENT_KEY } from 'webdriver'
import { describe, it, afterEach, expect, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('elements', () => {
    it('should fetch elements', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elems = await browser.$$('.foo')
        expect(elems).toBe(await elems.getElements())
        expect(vi.mocked(fetch).mock.calls[1][1]!.method).toBe('POST')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/elements')
        expect(vi.mocked(fetch).mock.calls[1][1]!.body)
            .toEqual(JSON.stringify({ using: 'css selector', value: '.foo' }))
        expect(elems).toHaveLength(3)

        expect(elems[0].elementId).toBe('some-elem-123')
        expect(elems[0][ELEMENT_KEY]).toBe('some-elem-123')
        expect(elems[0].ELEMENT).toBe(undefined)
        expect(elems[0].selector).toBe('.foo')
        expect(elems[0].index).toBe(0)
        expect(elems[0].constructor.name).toBe('Element')
        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1][ELEMENT_KEY]).toBe('some-elem-456')
        expect(elems[1].ELEMENT).toBe(undefined)
        expect(elems[1].selector).toBe('.foo')
        expect(elems[1].index).toBe(1)
        expect(elems[1].constructor.name).toBe('Element')
        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2][ELEMENT_KEY]).toBe('some-elem-789')
        expect(elems[2].ELEMENT).toBe(undefined)
        expect(elems[2].selector).toBe('.foo')
        expect(elems[2].index).toBe(2)
        expect(elems[2].constructor.name).toBe('Element')

        expect(elems.parent).toBe(browser)
        expect(elems.selector).toBe('.foo')
        expect((await elems.getElements()).foundWith).toBe('$$')
        expect(Array.isArray(elems)).toBe(true)
        expect(elems.then).toBeUndefined()
    })

    it('iterates, maps and indexes the list without awaiting it first', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const callsBefore = vi.mocked(fetch).mock.calls.length
        const pending = browser.$$('.foo')
        expect(Array.isArray(pending)).toBe(true)
        expect(vi.mocked(fetch).mock.calls.length).toBe(callsBefore)

        const ids: string[] = []
        for await (const element of browser.$$('.foo')) {
            ids.push(element.elementId)
        }
        expect(ids).toEqual(['some-elem-123', 'some-elem-456', 'some-elem-789'])

        await expect(browser.$$('.foo').map((element) => element.elementId)).resolves.toEqual(ids)
        await expect(browser.$$('.foo').length).resolves.toBe(3)
        await expect(browser.$$('.foo')[1].elementId).resolves.toBe('some-elem-456')

        const filtered = await browser.$$('.foo').filter((element) => element.elementId !== 'some-elem-456')
        expect(filtered).toHaveLength(2)
        expect(filtered.selector).toBe('.foo')
        expect(filtered.foundWith).toBe('$$')
        expect([...filtered].map((element) => element.elementId)).toEqual(['some-elem-123', 'some-elem-789'])

        expect(() => {
            for (const _element of browser.$$('.foo')) {
                // synchronous iteration has to wait until the list resolves
            }
        }).toThrow(/not resolved yet/)
    })

    it('runs before and after command hooks around the fetch', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const beforeCommand = vi.fn()
        const afterCommand = vi.fn()
        browser.options.beforeCommand = beforeCommand
        browser.options.afterCommand = afterCommand

        const elems = await browser.$$('.foo')

        expect(beforeCommand).toHaveBeenCalledWith('$$', ['.foo'])
        expect(afterCommand).toHaveBeenCalledWith('$$', ['.foo'], elems, undefined)
        expect(elems).toHaveLength(3)
    })

    it('keeps prototype from browser object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                // @ts-ignore mock feature
                mobileMode: true,
                'appium-version': '1.9.2'
            } as any
        })

        const elems = await browser.$$('.foo')
        expect(elems[0].isMobile).toBe(true)
        expect(elems[1].isMobile).toBe(true)
        expect(elems[2].isMobile).toBe(true)
    })

    it('it can create an element array based on single elements', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elemA = await browser.$('#foo')
        const elemB = { [ELEMENT_KEY]: 'foobar' }
        const elems = await browser.$$([elemA, elemB])
        expect(await elems.map((e) => e.elementId)).toEqual(['some-elem-123', 'foobar'])
    })

    it('resolves ChainablePromiseElement items passed in an array (#12706)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        ;(fetch as any).customResponseFor(/\/element\/some-elem-123\/text$/, { value: 'item text' })
        ;(fetch as any).customResponseFor(/\/element\/html-element\/text$/, { value: 'html text' })
        ;(fetch as any).customResponseFor(/\/element\/some-sub-elem-321\/text$/, { value: 'sub text' })

        const texts = await browser.$$([
            browser.$('.item'),
            browser.$('html'),
            browser.$('#foo').$('#subfoo')
        ]).map((e) => e.getText())

        expect(texts).toEqual(['item text', 'html text', 'sub text'])
    })

    it('resolves mixed arrays of chainable, resolved, chained, indexed and reference elements', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        ;(fetch as any).customResponseFor(/\/element\/[^/]+\/text$/, { value: 'ok' })

        const resolvedElem = await browser.$('#resolved')
        const rawRef = { [ELEMENT_KEY]: 'raw-ref-1' }
        const elems = await browser.$$([
            browser.$('#foo'),
            resolvedElem,
            rawRef,
            browser.$('#foo').$('#subfoo'),
            browser.$$('.foo')[1]
        ])

        expect(elems).toHaveLength(5)
        await expect(elems.map((e) => e.elementId)).resolves.toEqual([
            'some-elem-123',
            'some-elem-123',
            'raw-ref-1',
            'some-sub-elem-321',
            'some-elem-456'
        ])
        expect(elems[1]).toBe(resolvedElem)
        expect(elems.selector).toBeUndefined()
        expect(elems.parent).toBe(browser)
        await expect(elems.map((e) => e.getText())).resolves.toEqual(['ok', 'ok', 'ok', 'ok', 'ok'])
    })

    it('normalizes selector after resolving chainable elements and preserves not-found or selector-less elements', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const sameSelectorElems = await browser.$$([
            browser.$('.item'),
            browser.$('.item')
        ])
        expect(sameSelectorElems).toHaveLength(2)
        expect(sameSelectorElems.selector).toBe('.item')

        const withMissing = await browser.$$([
            browser.$('#foo'),
            browser.$('#nonexisting'),
            browser.$$('.foo').at(-99)
        ])
        expect(withMissing).toHaveLength(2)
        expect(withMissing[0].elementId).toBe('some-elem-123')
        expect(withMissing[1].elementId).toBeUndefined()
        expect(withMissing[1].error).toBeDefined()

        const refElem = await browser.$({ [ELEMENT_KEY]: 'ref-without-selector' })
        const fromRefChain = await browser.$$([browser.$({ [ELEMENT_KEY]: 'ref-without-selector' }), refElem])
        expect(fromRefChain).toHaveLength(2)
        expect(fromRefChain[0].elementId).toBe('ref-without-selector')
        expect(fromRefChain[1]).toBe(refElem)
        expect(fromRefChain.selector).toBeUndefined()

        const empty = await browser.$$([])
        expect(empty).toHaveLength(0)
        expect(empty.selector).toBeUndefined()
        expect(empty.parent).toBe(browser)
    })

    it('attaches rejection handlers concurrently when resolving promise items', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const unhandled: unknown[] = []
        const onUnhandled = (reason: unknown) => { unhandled.push(reason) }
        process.on('unhandledRejection', onUnhandled)
        try {
            const slow = new Promise<WebdriverIO.Element>((resolve) => {
                setTimeout(() => { resolve(browser.$('#foo').getElement()) }, 25)
            })
            const fastReject = Promise.reject(new Error('boom'))
            await expect(browser.$$([slow, fastReject])).rejects.toThrow('boom')
            await new Promise((resolve) => setTimeout(resolve, 40))
            expect(unhandled).toEqual([])
        } finally {
            process.off('unhandledRejection', onUnhandled)
        }
    })

    it('supports element-scoped and chained $$ with ChainablePromiseElement arrays and mixed HTMLElements', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        ;(fetch as any).customResponseFor(/\/element\/[^/]+\/text$/, { value: 'scoped' })

        const parent = await browser.$('#foo')
        const scoped = await parent.$$([parent.$('#subfoo'), browser.$('#foo')])
        expect(scoped).toHaveLength(2)
        expect(scoped[0].elementId).toBe('some-sub-elem-321')
        expect(scoped[1].elementId).toBe('some-elem-123')
        await expect(scoped.map((e) => e.getText())).resolves.toEqual(['scoped', 'scoped'])

        const chainedSame = await browser.$('#foo').$$([browser.$('.item'), browser.$('.item')])
        expect(chainedSame).toHaveLength(2)
        expect(chainedSame.selector).toBe('.item')

        const origWindow = (globalThis as any).window
        ;(globalThis as any).window = {}
        try {
            ;(fetch as any).customResponseFor(/\/execute\/sync$/, { value: { [ELEMENT_KEY]: 'dom-elem-1' } })
            class FakeHTMLElement {
                nodeType = 1
                nodeName = 'DIV'
            }
            const domNode = new FakeHTMLElement() as unknown as HTMLElement
            const mixedDom = await browser.$$([browser.$('#foo'), domNode])
            expect(mixedDom).toHaveLength(2)
            expect(mixedDom[0].elementId).toBe('some-elem-123')
            expect(mixedDom[1].elementId).toBe('dom-elem-1')
        } finally {
            if (typeof origWindow === 'undefined') {
                delete (globalThis as any).window
            } else {
                ;(globalThis as any).window = origWindow
            }
        }

        const resolvedList = await browser.$$('.foo')
        const fromResolvedList = await browser.$$(resolvedList as unknown as WebdriverIO.Element[])
        expect(fromResolvedList).toHaveLength(3)
        expect(fromResolvedList.selector).toBe('.foo')
        await expect(fromResolvedList.map((e) => e.elementId)).resolves.toEqual([
            'some-elem-123',
            'some-elem-456',
            'some-elem-789'
        ])

        const fromPendingList = await browser.$$(browser.$$('.foo') as unknown as WebdriverIO.Element[])
        expect(fromPendingList).toHaveLength(3)
        expect(fromPendingList.selector).toBe('.foo')
        await expect(fromPendingList.map((e) => e.elementId)).resolves.toEqual([
            'some-elem-123',
            'some-elem-456',
            'some-elem-789'
        ])
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
