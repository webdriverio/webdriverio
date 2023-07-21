import path from 'node:path'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { describe, it, afterEach, expect, vi } from 'vitest'
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
        expect(vi.mocked(got).mock.calls[1][1]!.method)
            .toBe('POST')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(got).mock.calls[1][1]!.json)
            .toEqual({ using: 'css selector', value: '#foo' })
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem[ELEMENT_KEY]).toBe('some-elem-123')
        expect(elem.ELEMENT).toBe(undefined)
    })

    it('should fetch an element (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        expect(elem[ELEMENT_KEY]).toBe(undefined)
        expect(elem.ELEMENT).toBe('some-elem-123')
    })

    it('should allow to transform protocol reference into a WebdriverIO element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$({ [ELEMENT_KEY]: 'foobar' })
        expect(elem.elementId).toBe('foobar')
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

        expect(browser.isMobile).toBe(true)
        const elem = await browser.$('#foo')
        expect(elem.isMobile).toBe(true)
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})!
