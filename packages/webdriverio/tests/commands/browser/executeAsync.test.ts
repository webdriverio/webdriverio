import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('executeAsync test', () => {
    it('should allow to check if an element is enabled', async () => {
        const browser: WebdriverIO.Browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.executeAsync(() => 'foobar', 1, 2, 3)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/execute/async')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as string)).toEqual(expect.objectContaining({
            script: expect.stringContaining('return (() => "foobar").apply(null, arguments)'),
            args: [1, 2, 3]
        }))
    })

    it('should return correct value', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const result: string = await browser.executeAsync((foo, bar, done) => {
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
        await expect(() => browser.executeAsync(null)).rejects.toThrow()
        // @ts-expect-error test invalid parameter
        await expect(() => browser.executeAsync(1234)).rejects.toThrow()
    })
})
