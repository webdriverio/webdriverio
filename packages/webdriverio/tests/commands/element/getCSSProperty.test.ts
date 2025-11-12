/**
 * @vitest-environment jsdom
 */
import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getCSSProperty test', () => {
    it('should allow to get the css property of an element', async () => {
        globalThis.window.getComputedStyle = vi.fn().mockReturnValue({
            'width': '1250px'
        })

        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('width')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(property.value).toBe('1250px')
        expect(property.parsed.value).toBe(1250)
    })

    it('should merge equal symmetrical values', async () => {
        globalThis.window.getComputedStyle = vi.fn().mockReturnValue({
            'padding-top': '4px',
            'padding-right': '2px',
            'padding-bottom': '4px',
            'padding-left': '2px'
        })

        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('padding')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(property.value).toBe('4px 2px')
    })

    it('should use execute when pseudo element is given', async () => {
        globalThis.window.getComputedStyle = vi.fn().mockReturnValue({
            'padding-top': '1px',
            'padding-right': '1px',
            'padding-bottom': '1px',
            'padding-left': '1px'
        })
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('padding', '::before')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(property.value).toBe('1px')
    })

    it('should reduce if values are symmetric', async () => {
        globalThis.window.getComputedStyle = vi.fn().mockReturnValue({
            'padding-top': '1px',
            'padding-right': '2px',
            'padding-bottom': '1px',
            'padding-left': '2px'
        })
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('padding', '::before')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(property.value).toBe('1px 2px')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
