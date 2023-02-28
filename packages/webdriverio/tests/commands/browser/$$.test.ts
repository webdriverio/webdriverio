import path from 'node:path'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { describe, it, afterEach, expect, vi } from 'vitest'
import { remote } from '../../../src/index.js'
import { ELEMENT_KEY } from '../../../src/constants.js'

vi.mock('got')
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
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/elements')
        expect(vi.mocked(got).mock.calls[1][1]!.json)
            .toEqual({ using: 'css selector', value: '.foo' })
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
        expect(elems.foundWith).toBe('$$')
    })

    it('should fetch elements (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elems = await browser.$$('.foo')
        expect(elems).toHaveLength(3)
        expect(elems[0][ELEMENT_KEY]).toBe(undefined)
        expect(elems[0].ELEMENT).toBe('some-elem-123')
        expect(elems[1][ELEMENT_KEY]).toBe(undefined)
        expect(elems[1].ELEMENT).toBe('some-elem-456')
        expect(elems[2][ELEMENT_KEY]).toBe(undefined)
        expect(elems[2].ELEMENT).toBe('some-elem-789')
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
        vi.mocked(got).mockClear()
    })
})
