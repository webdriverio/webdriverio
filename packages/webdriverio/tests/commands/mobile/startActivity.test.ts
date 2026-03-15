import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('startActivity', () => {
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
            await expect(browser.startActivity('com.example.app', '.MainActivity')).rejects.toThrow('The `startActivity` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.startActivity({ appPackage: 'com.example', appActivity: '.MainActivity' })).rejects.toThrow('The `startActivity` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: startActivity succeeds)', () => {
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

        it('should call mobile: startActivity with only required arguments', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.startActivity('com.example.app', '.MainActivity')
            expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                appPackage: 'com.example.app',
                appActivity: '.MainActivity',
                appWaitPackage: undefined,
                appWaitActivity: undefined,
                intentAction: undefined,
                intentCategory: undefined,
                intentFlags: undefined,
                optionalIntentArguments: undefined,
                dontStopAppOnReset: undefined,
            })
        })

        it('should call mobile: startActivity with all optional arguments', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.startActivity(
                'com.example.app',
                '.SplashActivity',
                'com.example.app',
                '.MainActivity',
                'android.intent.action.MAIN',
                'android.intent.category.LAUNCHER',
                '0x10200000',
                '--es key value',
                'true'
            )
            expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                appPackage: 'com.example.app',
                appActivity: '.SplashActivity',
                appWaitPackage: 'com.example.app',
                appWaitActivity: '.MainActivity',
                intentAction: 'android.intent.action.MAIN',
                intentCategory: 'android.intent.category.LAUNCHER',
                intentFlags: '0x10200000',
                optionalIntentArguments: '--es key value',
                dontStopAppOnReset: 'true',
            })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.startActivity('com.example.app', '.MainActivity')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: startActivity returns unknown method)', () => {
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

        it('should fall back to appiumStartActivity with only required args and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: startActivity'))
            const appiumSpy = vi.spyOn(browser, 'appiumStartActivity').mockResolvedValue(undefined)

            await browser.startActivity('com.example.app', '.MainActivity')

            expect(appiumSpy).toHaveBeenCalledWith(
                'com.example.app',
                '.MainActivity',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            )
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: startActivity'))
        })

        it('should fall back to appiumStartActivity with all 9 args and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumStartActivity').mockResolvedValue(undefined)

            await browser.startActivity(
                'com.example.app',
                '.SplashActivity',
                'com.example.app',
                '.MainActivity',
                'android.intent.action.MAIN',
                'android.intent.category.LAUNCHER',
                '0x10200000',
                '--es key value',
                'true'
            )

            expect(appiumSpy).toHaveBeenCalledWith(
                'com.example.app',
                '.SplashActivity',
                'com.example.app',
                '.MainActivity',
                'android.intent.action.MAIN',
                'android.intent.category.LAUNCHER',
                '0x10200000',
                '--es key value',
                'true'
            )
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: startActivity'))
        })
    })
})
