import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote, Key } from '../../../src/index.js'

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
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toContain('/actions')
        expect(vi.mocked(got).mock.calls[1][1]!.json.actions)
            .toHaveLength(1)
        expect(vi.mocked(got).mock.calls[1][1]!.json.actions[0].type)
            .toBe('key')
        expect(vi.mocked(got).mock.calls[1][1]!.json.actions[0].actions)
            .toHaveLength(('foobar'.length * 2) + 1 /* includes pause call */)
        expect(vi.mocked(got).mock.calls[1][1]!.json.actions[0].actions[0])
            .toEqual({ type: 'keyDown', value: 'f' })
        expect(vi.mocked(got).mock.calls[1][1]!.json.actions[0].actions[12])
            .toEqual({ type: 'keyUp', value: 'r' })
    })

    it('should throw if invalid character was provided', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-expect-error wrong param
        await expect(() => browser.keys()).rejects.toThrow()
        // @ts-expect-error wrong param
        await expect(() => browser.keys(1)).rejects.toThrow()
        // @ts-expect-error wrong param
        await expect(() => browser.keys(true)).rejects.toThrow()
    })

    it('transforms control', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        await browser.keys([Key.Ctrl, 'c'])
        expect(vi.mocked(got).mock.calls[1][1].json.actions[0].actions).toEqual([
            { type: 'keyDown', value: expect.any(String) },
            { type: 'keyDown', value: 'c' },
            { type: 'pause', duration: 10 },
            { type: 'keyUp', value: expect.any(String) },
            { type: 'keyUp', value: 'c' }
        ])
    })

    it('should not send a pause for iOS', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'safari',
                platformName: 'iOS',
            }
        })
        await browser.keys(['c'])
        expect(vi.mocked(got).mock.calls[1][1].json.actions[0].actions).toEqual([
            { type: 'keyDown', value: 'c' },
            { type: 'keyUp', value: 'c' }
        ])
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
