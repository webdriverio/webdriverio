import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
import { remote, Key } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('sendKeys test', () => {
    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should throw an error for non-mobile platforms', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })

        await expect(browser.sendKeys('abc')).rejects.toThrow(
            'The `sendKeys` command is only available for mobile platforms.'
        )
    })

    it('should send paired keyDown/keyUp actions per character for a string', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        await browser.sendKeys('abc')

        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname).toContain('/actions')
        const body = JSON.parse((vi.mocked(fetch).mock.calls[1][1] as any).body)
        expect(body.actions).toHaveLength(1)
        expect(body.actions[0].type).toBe('key')
        expect(body.actions[0].actions).toEqual([
            { type: 'keyDown', value: 'a' },
            { type: 'keyUp', value: 'a' },
            { type: 'keyDown', value: 'b' },
            { type: 'keyUp', value: 'b' },
            { type: 'keyDown', value: 'c' },
            { type: 'keyUp', value: 'c' },
        ])
    })

    it('should send paired keyDown/keyUp actions for an array of strings and special keys', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        await browser.sendKeys(['1', '2', Key.Enter])

        const body = JSON.parse((vi.mocked(fetch).mock.calls[1][1] as any).body)
        expect(body.actions[0].actions).toEqual([
            { type: 'keyDown', value: '1' },
            { type: 'keyUp', value: '1' },
            { type: 'keyDown', value: '2' },
            { type: 'keyUp', value: '2' },
            { type: 'keyDown', value: Key.Enter },
            { type: 'keyUp', value: Key.Enter },
        ])
    })

    it('should not dispatch actions when given an empty string or empty array', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        const performActionsSpy = vi.spyOn(browser, 'performActions')
        await browser.sendKeys('')
        await browser.sendKeys([])

        expect(performActionsSpy).not.toHaveBeenCalled()
    })

    it('should throw if invalid parameter is provided', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        // @ts-expect-error wrong param
        await expect(() => browser.sendKeys()).rejects.toThrow(
            '"sendKeys" command requires a string or array of strings as parameter'
        )
        // @ts-expect-error wrong param
        await expect(() => browser.sendKeys(123)).rejects.toThrow(
            '"sendKeys" command requires a string or array of strings as parameter'
        )
    })
})
