import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getValue', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should get the value using getElementProperty in web mode', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        await elem.getValue()
        const url = vi.mocked(fetch).mock.calls[2][0] as URL
        expect(url.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/property/value')
    })

    it('should get value using getElementProperty in mobile web mode', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true
            } as any
        })
        const elem = await browser.$('#foo')

        await elem.getValue()

        const url = vi.mocked(fetch).mock.calls[2][0] as URL
        expect(url.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/property/value')
    })

    it('should get value using getElementProperty in mobile native mode', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                nativeAppMode: true
            } as any
        })
        const elem = await browser.$('#foo')

        await elem.getValue()

        const url = vi.mocked(fetch).mock.calls[2][0] as URL
        expect(url.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/attribute/value')
    })
})
