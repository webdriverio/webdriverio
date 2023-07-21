import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getCSSProperty test', () => {
    it('should allow to get the css property of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('width')

        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/css/width')
        expect(property.value).toBe('1250px')
        expect(property.parsed.value).toBe(1250)
    })

    it('should merge equal symmetrical values', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('padding')

        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/css/padding-top')
        expect(property.value).toBe('4px 2px')
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
