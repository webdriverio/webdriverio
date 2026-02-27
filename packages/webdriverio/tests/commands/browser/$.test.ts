import path from 'node:path'

import { ELEMENT_KEY } from 'webdriver'
import { describe, it, afterEach, expect, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
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
        expect(elem).toBe(await elem.getElement())
        expect(vi.mocked(fetch).mock.calls[1][1]!.method)
            .toBe('POST')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(fetch).mock.calls[1][1]!.body)
            .toEqual(JSON.stringify({ using: 'css selector', value: '#foo' }))
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem[ELEMENT_KEY]).toBe('some-elem-123')
        expect(elem.ELEMENT).toBe(undefined)
    })

    it('should allow to transform protocol reference into a WebdriverIO element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
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

    it('should not treat a11y selectors as deep selectors', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('a11y/Submit')
        // Since a11y selectors now use script execution (via findAccessibilityElement -> browser.execute),
        // we expect the second fetch call to be to the execute endpoint, not element endpoint.
        const requestUrl = vi.mocked(fetch).mock.calls[1][0] as any
        expect(requestUrl.pathname).toContain('/execute')

        // The body should contain the script
        const requestBody = JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string)
        expect(requestBody.script).toBeDefined()
        expect(requestBody.args).toBeDefined()
        // args[0] is selector name, args[1] is role, args[2] is options
        expect(requestBody.args[0]).toBe('Submit')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})!
