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

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
