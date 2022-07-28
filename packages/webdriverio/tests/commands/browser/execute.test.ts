import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'
// @ts-expect-error
import got from 'got'

import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isEnabled test', () => {
    it('should allow to check if an element is enabled', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.execute((a, b, c) => a + b + c, 1, 2, 3)
        expect((vi.mocked(got).mock.calls[1][0] as any).pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect((vi.mocked(got).mock.calls[1][1] as any).json.script)
            .toBe('return ((a, b, c) => a + b + c).apply(null, arguments)')
        expect((vi.mocked(got).mock.calls[1][1] as any).json.args)
            .toEqual([1, 2, 3])
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
