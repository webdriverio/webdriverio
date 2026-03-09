import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('shake', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        log.warn = vi.fn()
    })

    describe('non-mobile', () => {
        it('should throw for non-mobile platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar' } as any
            })
            await expect(browser.shake()).rejects.toThrow('The `shake` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-Android platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
            })
            await expect(browser.shake()).rejects.toThrow('The `shake` command is only available for iOS.')
        })
    })

    describe('modern driver (mobile: shake succeeds)', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    platformName: 'iOS',
                } as any
            })
        })

        it('should call mobile: shake with no args', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.shake()
            expect(executeSpy).toHaveBeenCalledWith('mobile: shake', {})
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.shake()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: shake returns unknown method)', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    platformName: 'iOS',
                } as any
            })
        })

        it('should fall back to appiumShake and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: shake'))
            const appiumShakeSpy = vi.spyOn(browser, 'appiumShake').mockResolvedValue(undefined)

            await browser.shake()

            expect(appiumShakeSpy).toHaveBeenCalledWith()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: shake'))
        })

        it('should fall back to appiumShake on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumShakeSpy = vi.spyOn(browser, 'appiumShake').mockResolvedValue(undefined)

            await browser.shake()

            expect(appiumShakeSpy).toHaveBeenCalledWith()
        })
    })
})
