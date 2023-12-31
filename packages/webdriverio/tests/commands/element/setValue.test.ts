import path from 'node:path'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setValue', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should set the value clearing the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/clear')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/value')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]!.body as any).text).toEqual('foobar')
    })
})
