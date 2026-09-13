import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('gsmSignal', () => {
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
            await expect(browser.gsmSignal(4)).rejects.toThrow('The `gsmSignal` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.gsmSignal(4)).rejects.toThrow('The `gsmSignal` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: gsmSignal succeeds)', () => {
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

        it('should call mobile: gsmSignal with signalStrength as a number', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.gsmSignal(4)
            expect(executeSpy).toHaveBeenCalledWith('mobile: gsmSignal', { signalStrength: 4 })
        })

        it('should call mobile: gsmSignal with signalStrength 0', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.gsmSignal(0)
            expect(executeSpy).toHaveBeenCalledWith('mobile: gsmSignal', { signalStrength: 0 })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.gsmSignal(4)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: gsmSignal returns unknown method)', () => {
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

        it('should fall back to appiumGsmSignal and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: gsmSignal'))
            const appiumSpy = vi.spyOn(browser, 'appiumGsmSignal').mockResolvedValue(undefined)

            await browser.gsmSignal(4)

            expect(appiumSpy).toHaveBeenCalledWith('4')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: gsmSignal'))
        })

        it('should pass signalStrength 0 to appiumGsmSignal on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumGsmSignal').mockResolvedValue(undefined)

            await browser.gsmSignal(0)

            expect(appiumSpy).toHaveBeenCalledWith('0')
        })
    })
})
