import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('fingerPrint', () => {
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
            await expect(browser.fingerPrint(1)).rejects.toThrow('The `fingerPrint` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.fingerPrint(1)).rejects.toThrow('The `fingerPrint` command is only available for Android. For iOS, use `touchId` instead.')
        })
    })

    describe('modern driver (mobile: fingerPrint succeeds)', () => {
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

        it('should call mobile: fingerPrint with the given fingerprintId', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.fingerPrint(1)
            expect(executeSpy).toHaveBeenCalledWith('mobile: fingerPrint', { fingerprintId: 1 })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.fingerPrint(1)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: fingerPrint returns unknown method)', () => {
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

        it('should fall back to appiumFingerPrint and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: fingerPrint'))
            const appiumSpy = vi.spyOn(browser, 'appiumFingerPrint').mockResolvedValue(undefined)

            await browser.fingerPrint(1)

            expect(appiumSpy).toHaveBeenCalledWith(1)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: fingerPrint'))
        })

        it('should pass fingerprintId to appiumFingerPrint on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumFingerPrint').mockResolvedValue(undefined)

            await browser.fingerPrint(5)

            expect(appiumSpy).toHaveBeenCalledWith(5)
        })
    })
})
