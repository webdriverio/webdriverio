import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('pressKeyCode', () => {
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
            await expect(browser.pressKeyCode(3)).rejects.toThrow('The `pressKeyCode` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.pressKeyCode(4)).rejects.toThrow('The `pressKeyCode` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: pressKey succeeds)', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    platformName: 'Android',
                } as any
            })
        })

        it('should call mobile: pressKey with keycode only', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.pressKeyCode(3)
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: 3, metastate: undefined, flags: undefined })
        })

        it('should call mobile: pressKey with keycode, metastate and flags', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.pressKeyCode(29, 1, 0)
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: 29, metastate: 1, flags: 0 })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.pressKeyCode(3)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: pressKey returns unknown method)', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    platformName: 'Android',
                } as any
            })
        })

        it('should fall back to appiumPressKeyCode and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: pressKey'))
            const appiumSpy = vi.spyOn(browser, 'appiumPressKeyCode').mockResolvedValue(undefined)

            await browser.pressKeyCode(3)

            expect(appiumSpy).toHaveBeenCalledWith(3, undefined, undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: pressKey'))
        })

        it('should pass all args to appiumPressKeyCode on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumPressKeyCode').mockResolvedValue(undefined)

            await browser.pressKeyCode(29, 1, 2)

            expect(appiumSpy).toHaveBeenCalledWith(29, 1, 2)
        })
    })
})
