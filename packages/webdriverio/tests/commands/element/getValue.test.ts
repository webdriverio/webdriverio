import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getValue', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should get the value using getElementProperty', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        await elem.getValue()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/property/value')
    })

    it('should get the value using getElementAttribute', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')

        await elem.getValue()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/attribute/value')
    })

    it('should get value in mobile mode', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                // @ts-ignore mock feature
                mobileMode: true
            } as any
        })
        const elem = await browser.$('#foo')

        await elem.getValue()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/attribute/value')
    })
})
