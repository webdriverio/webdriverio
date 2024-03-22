import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isEnabled test', () => {
    it('should execute async script', async () => {
        const browser: WebdriverIO.Browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.$('#foo').executeAsync(() => 'foobar', 1, 2, 3)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(fetch).mock.calls[2][1]?.body).toMatchObject(JSON.stringify({
            script: 'return (() => "foobar").apply(null, arguments)',
            args: [1, 2, 3, { [ELEMENT_KEY]: 'some-elem-123', ELEMENT: 'some-elem-123' }]
        }))
    })

    it('should return correct value', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const result: string = await browser.$('#foo').executeAsync((foo, bar, elem, done) => {
            done(foo + bar)
        }, 'foo', 1)
        expect(result).toEqual('foo1')
    })

    it('should throw if script is wrong type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-expect-error test invalid parameter
        await expect(() => browser.$('#foo').executeAsync(null)).rejects.toThrow()
        // @ts-expect-error test invalid parameter
        await expect(() => browser.$('#foo').executeAsync(1234)).rejects.toThrow()
    })
})
