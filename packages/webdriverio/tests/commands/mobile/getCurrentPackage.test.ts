import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getCurrentPackage', () => {
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
            await expect(browser.getCurrentPackage()).rejects.toThrow('The `getCurrentPackage` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.getCurrentPackage()).rejects.toThrow('The `getCurrentPackage` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: getCurrentPackage succeeds)', () => {
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

        it('should call mobile: getCurrentPackage and return the package name', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue('com.example.app')
            const result = await browser.getCurrentPackage()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getCurrentPackage', {})
            expect(result).toBe('com.example.app')
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getCurrentPackage()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: getCurrentPackage returns unknown method)', () => {
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

        it('should fall back to appiumGetCurrentPackage and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: getCurrentPackage'))
            const appiumGetCurrentPackageSpy = vi.spyOn(browser, 'appiumGetCurrentPackage').mockResolvedValue('com.example.app')

            const result = await browser.getCurrentPackage()

            expect(appiumGetCurrentPackageSpy).toHaveBeenCalledWith()
            expect(result).toBe('com.example.app')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: getCurrentPackage'))
        })

        it('should fall back to appiumGetCurrentPackage on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumGetCurrentPackageSpy = vi.spyOn(browser, 'appiumGetCurrentPackage').mockResolvedValue('com.other.app')

            const result = await browser.getCurrentPackage()

            expect(appiumGetCurrentPackageSpy).toHaveBeenCalledWith()
            expect(result).toBe('com.other.app')
        })
    })
})
