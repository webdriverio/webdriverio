import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('longPressKeyCode', () => {
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
            await expect(browser.longPressKeyCode(3)).rejects.toThrow('The `longPressKeyCode` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.longPressKeyCode(4)).rejects.toThrow('The `longPressKeyCode` command is only available for Android.')
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

        it('should call mobile: pressKey with isLongPress: true and keycode only', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.longPressKeyCode(3)
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: 3, metastate: undefined, flags: undefined, isLongPress: true })
        })

        it('should call mobile: pressKey with all args and isLongPress: true', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.longPressKeyCode(29, 1, 0)
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: 29, metastate: 1, flags: 0, isLongPress: true })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.longPressKeyCode(3)).rejects.toThrow('device disconnected')
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

        it('should fall back to appiumLongPressKeyCode and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: pressKey'))
            const appiumSpy = vi.spyOn(browser, 'appiumLongPressKeyCode').mockResolvedValue(undefined)

            await browser.longPressKeyCode(3)

            expect(appiumSpy).toHaveBeenCalledWith(3, undefined, undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: pressKey'))
        })

        it('should pass all args to appiumLongPressKeyCode on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumLongPressKeyCode').mockResolvedValue(undefined)

            await browser.longPressKeyCode(29, 1, 2)

            expect(appiumSpy).toHaveBeenCalledWith(29, 1, 2)
        })
    })
})
