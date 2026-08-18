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
        // Due to mobileMode being enabled we will have extra calls to fetch
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/attribute/value')
    })

    it('should return empty string if value is not a string', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        // mocked return value is an object
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue({ some: 'object' })
        expect(await elem.getValue()).toBe('')

        // mocked return value is null
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue(null)
        expect(await elem.getValue()).toBe('')

        // mocked return value is undefined
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue(undefined)
        expect(await elem.getValue()).toBe('')
    })

    it('should return empty string if attribute is null or undefined', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                // @ts-ignore mock feature
                mobileMode: true
            } as any
        })
        const elem = await browser.$('#foo')

        // mocked return value is null
        vi.spyOn(elem, 'getElementAttribute').mockResolvedValue(null)
        expect(await elem.getValue()).toBe('')
    })
})
