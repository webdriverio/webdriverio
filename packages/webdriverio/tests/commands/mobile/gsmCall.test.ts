import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('gsmCall', () => {
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
            await expect(browser.gsmCall('+15551234567', 'call')).rejects.toThrow('The `gsmCall` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.gsmCall('1234567890', 'call')).rejects.toThrow('The `gsmCall` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: gsmCall succeeds)', () => {
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

        it('should call mobile: gsmCall with phoneNumber and action', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.gsmCall('+15551234567', 'call')
            expect(executeSpy).toHaveBeenCalledWith('mobile: gsmCall', { phoneNumber: '+15551234567', action: 'call' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.gsmCall('+15551234567', 'call')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: gsmCall returns unknown method)', () => {
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

        it('should fall back to appiumGsmCall and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: gsmCall'))
            const appiumSpy = vi.spyOn(browser, 'appiumGsmCall').mockResolvedValue(undefined)

            await browser.gsmCall('+15551234567', 'call')

            expect(appiumSpy).toHaveBeenCalledWith('+15551234567', 'call')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: gsmCall'))
        })

        it('should pass phoneNumber and action to appiumGsmCall on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumGsmCall').mockResolvedValue(undefined)

            await browser.gsmCall('+15551234567', 'accept')

            expect(appiumSpy).toHaveBeenCalledWith('+15551234567', 'accept')
        })
    })
})
