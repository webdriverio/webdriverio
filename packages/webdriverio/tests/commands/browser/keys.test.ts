import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('keys', () => {
    it('should send keys', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.keys('foobar')
        expect(got.mock.calls[1][0].pathname)
            .toContain('/actions')
        expect(got.mock.calls[1][1].json.actions)
            .toHaveLength(1)
        expect(got.mock.calls[1][1].json.actions[0].type)
            .toBe('key')
        expect(got.mock.calls[1][1].json.actions[0].actions)
            .toHaveLength('foobar'.length * 2)
        expect(got.mock.calls[1][1].json.actions[0].actions[0])
            .toEqual({ type: 'keyDown', value: 'f' })
        expect(got.mock.calls[1][1].json.actions[0].actions[11])
            .toEqual({ type: 'keyUp', value: 'r' })
    })

    it('should send keys (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.keys('foobar')
        expect(got.mock.calls[1][0].pathname).toContain('/keys')
        expect(got.mock.calls[1][1].json.value).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])

        await browser.keys('Enter')
        expect(got.mock.calls[2][0].pathname).toContain('/keys')
        expect(got.mock.calls[2][1].json.value).toEqual(['\uE007'])
    })

    it('should allow send keys as array', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.keys(['f', 'o', 'Enter', 'b', 'a', 'r'])
        expect(got.mock.calls[1][0].pathname).toContain('/keys')
        expect(got.mock.calls[1][1].json.value).toEqual(['f', 'o', '\uE007', 'b', 'a', 'r'])

        await browser.keys('Enter')
        expect(got.mock.calls[2][0].pathname).toContain('/keys')
        expect(got.mock.calls[2][1].json.value).toEqual(['\uE007'])
    })

    it('should throw if invalid character was provided', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        // @ts-expect-error wrong param
        await expect(() => browser.keys()).rejects.toThrow()
        // @ts-expect-error wrong param
        await expect(() => browser.keys(1)).rejects.toThrow()
        // @ts-expect-error wrong param
        await expect(() => browser.keys(true)).rejects.toThrow()
    })

    afterEach(() => {
        got.mockClear()
    })
})
