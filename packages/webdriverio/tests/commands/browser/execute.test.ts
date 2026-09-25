import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('execute test', () => {
    it('should execute the script', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.execute((a, b, c) => a + b + c, 1, 2, 3)
        expect((vi.mocked(fetch).mock.calls[1][0] as any).pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as string)).toEqual(expect.objectContaining({
            script: expect.stringContaining('return ((a, b, c) => a + b + c).apply(null, arguments)'),
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

        const result = await browser.execute((value) => value, 'foobar')
        expect(result).toEqual('foobar')
    })

    it('should await an async function via execute/async', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        vi.mocked(fetch).mockClear()
        await browser.execute(async (value: string) => value, 'foobar')
        const [requestUrl, request] = vi.mocked(fetch).mock.calls.at(-1)!
        expect((requestUrl as URL).pathname).toBe('/session/foobar-123/execute/async')
        expect(JSON.parse((request as { body: string }).body).script).toContain('async (value)')
    })

    it('should throw if script is wrong type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-expect-error
        await expect(() => browser.execute(null)).rejects.toThrow()
        // @ts-expect-error
        await expect(() => browser.execute(1234)).rejects.toThrow()
    })
})
