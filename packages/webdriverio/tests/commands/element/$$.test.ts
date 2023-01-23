import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'
import { ELEMENT_KEY } from '../../../src/constants.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('element', () => {
    it('should fetch an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        const elems = await elem.$$('#subfoo')
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(got).mock.calls[1][1]!.json)
            .toEqual({ using: 'css selector', value: '#foo' })
        expect(elem.elementId).toBe('some-elem-123')
        expect(vi.mocked(got).mock.calls[2][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/elements')
        expect(vi.mocked(got).mock.calls[2][1]!.json)
            .toEqual({ using: 'css selector', value: '#subfoo' })
        expect(elems).toHaveLength(3)

        expect(elems[0].elementId).toBe('some-sub-elem-321')
        expect(elems[0][ELEMENT_KEY]).toBe('some-sub-elem-321')
        expect(elems[0].ELEMENT).toBe(undefined)
        expect(elems[0].selector).toBe('#subfoo')
        expect(elems[0].index).toBe(0)
        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1][ELEMENT_KEY]).toBe('some-elem-456')
        expect(elems[1].ELEMENT).toBe(undefined)
        expect(elems[1].selector).toBe('#subfoo')
        expect(elems[1].index).toBe(1)
        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2][ELEMENT_KEY]).toBe('some-elem-789')
        expect(elems[2].ELEMENT).toBe(undefined)
        expect(elems[2].selector).toBe('#subfoo')
        expect(elems[2].index).toBe(2)
    })

    it('should fetch an element (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        const elems = await elem.$$('#subfoo')
        expect(elems).toHaveLength(3)
        expect(elems[0][ELEMENT_KEY]).toBe(undefined)
        expect(elems[0].ELEMENT).toBe('some-sub-elem-321')
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

        const elem = await browser.$('#foo')
        const elems = await elem.$$('.foo')
        expect(elems[0].isMobile).toBe(true)
        expect(elems[1].isMobile).toBe(true)
        expect(elems[2].isMobile).toBe(true)
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
