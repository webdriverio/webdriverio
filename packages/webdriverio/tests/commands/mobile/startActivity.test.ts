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
        it('should throw for iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.startActivity('com.example', '.MainActivity')).rejects.toThrow('The `startActivity` command is only available for Android.')
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

        describe('legacy positional API', () => {
            it('should build component from appPackage and appActivity', async () => {
                const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
                await browser.startActivity('com.example.app', '.MainActivity')
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                    component: 'com.example.app/.MainActivity',
                })
            })

            it('should map intentAction, intentCategory and intentFlags', async () => {
                const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
                await browser.startActivity(
                    'com.example.app',
                    '.MainActivity',
                    undefined,
                    undefined,
                    'android.intent.action.MAIN',
                    'android.intent.category.LAUNCHER',
                    '0x10200000'
                )
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                    component: 'com.example.app/.MainActivity',
                    action: 'android.intent.action.MAIN',
                    categories: 'android.intent.category.LAUNCHER',
                    flags: '0x10200000',
                })
            })

            it('should map dontStopAppOnReset=true to stop=false', async () => {
                const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
                await browser.startActivity(
                    'com.example.app',
                    '.MainActivity',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'true'
                )
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                    component: 'com.example.app/.MainActivity',
                    stop: false,
                })
            })

            it('should map dontStopAppOnReset=false to stop=true', async () => {
                const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
                await browser.startActivity(
                    'com.example.app',
                    '.MainActivity',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'false'
                )
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                    component: 'com.example.app/.MainActivity',
                    stop: true,
                })
            })
        })

        describe('object-based API', () => {
            it('should accept an options object with required fields', async () => {
                const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
                await browser.startActivity({ appPackage: 'com.example.app', appActivity: '.MainActivity' })
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                    component: 'com.example.app/.MainActivity',
                })
            })

            it('should map intent options from the object', async () => {
                const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
                await browser.startActivity({
                    appPackage: 'com.example.app',
                    appActivity: '.MainActivity',
                    intentAction: 'android.intent.action.MAIN',
                    intentCategory: 'android.intent.category.LAUNCHER',
                    intentFlags: '0x10200000',
                })
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                    component: 'com.example.app/.MainActivity',
                    action: 'android.intent.action.MAIN',
                    categories: 'android.intent.category.LAUNCHER',
                    flags: '0x10200000',
                })
            })

            it('should map dontStopAppOnReset from the object', async () => {
                const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
                await browser.startActivity({
                    appPackage: 'com.example.app',
                    appActivity: '.MainActivity',
                    dontStopAppOnReset: 'true',
                })
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', {
                    component: 'com.example.app/.MainActivity',
                    stop: false,
                })
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

        it('should fall back to appiumStartActivity with positional args and log a warning', async () => {
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

        it('should fall back to appiumStartActivity with all args from object API', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumStartActivity').mockResolvedValue(undefined)

            await browser.startActivity({
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
        })
    })
})
