import path from 'node:path'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setValue', () => {
    let browser: any

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    afterEach(() => {
        got.mockClear()
    })

    it('should set the value clearing the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/clear')
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/value')
        expect(got.mock.calls[3][1].json.text).toEqual('foobar')
    })
})
