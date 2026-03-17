import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('launchApp', () => {
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
            await expect(browser.launchApp()).rejects.toThrow('The `launchApp` command is only available for mobile platforms.')
        })
    })

    describe('iOS - modern driver', () => {
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

        it('should auto-detect bundleId and call mobile: launchApp', async () => {
            vi.spyOn(browser, 'execute')
                .mockResolvedValueOnce({ bundleId: 'com.example.app' })
                .mockResolvedValueOnce(undefined)

            await browser.launchApp()

            expect(browser.execute).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
            expect(browser.execute).toHaveBeenNthCalledWith(2, 'mobile: launchApp', { bundleId: 'com.example.app' })
        })

        it('should use provided bundleId', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

            await browser.launchApp({ bundleId: 'com.example.myapp' })

            expect(executeSpy).toHaveBeenCalledOnce()
            expect(executeSpy).toHaveBeenCalledWith('mobile: launchApp', { bundleId: 'com.example.myapp' })
        })

        it('should pass arguments and environment to mobile: launchApp', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

            await browser.launchApp({
                bundleId: 'com.example.myapp',
                arguments: ['-AppleLanguages', '(en)'],
                environment: { MY_VAR: 'value' },
            })

            expect(executeSpy).toHaveBeenCalledWith('mobile: launchApp', {
                bundleId: 'com.example.myapp',
                arguments: ['-AppleLanguages', '(en)'],
                environment: { MY_VAR: 'value' },
            })
        })

        it('should re-throw non-unknown-method errors on iOS', async () => {
            vi.spyOn(browser, 'execute')
                .mockResolvedValueOnce({ bundleId: 'com.example.app' })
                .mockRejectedValueOnce(new Error('device disconnected'))
            await expect(browser.launchApp()).rejects.toThrow('device disconnected')
        })
    })

    describe('Android - modern driver', () => {
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

        it('should auto-detect appId and call mobile: activateApp', async () => {
            vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.example.app')
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

            await browser.launchApp()

            expect(browser.getCurrentPackage).toHaveBeenCalledOnce()
            expect(executeSpy).toHaveBeenCalledWith('mobile: activateApp', { appId: 'com.example.app' })
        })

        it('should use provided appId and call mobile: activateApp', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

            await browser.launchApp({ appId: 'com.example.myapp' })

            expect(executeSpy).toHaveBeenCalledOnce()
            expect(executeSpy).toHaveBeenCalledWith('mobile: activateApp', { appId: 'com.example.myapp' })
        })

        it('should re-throw non-unknown-method errors on Android', async () => {
            vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.example.app')
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.launchApp()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback on iOS', () => {
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

        it('should fall back to appiumLaunchApp and log a warning on iOS', async () => {
            vi.spyOn(browser, 'execute')
                .mockResolvedValueOnce({ bundleId: 'com.example.app' })
                .mockRejectedValueOnce(new Error('unknown method: mobile: launchApp'))
            const appiumLaunchAppSpy = vi.spyOn(browser, 'appiumLaunchApp').mockResolvedValue(undefined)

            await browser.launchApp()

            expect(appiumLaunchAppSpy).toHaveBeenCalled()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: launchApp'))
        })
    })

    describe('legacy driver fallback on Android', () => {
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

        it('should fall back to appiumLaunchApp and log a warning on Android', async () => {
            vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.example.app')
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumLaunchAppSpy = vi.spyOn(browser, 'appiumLaunchApp').mockResolvedValue(undefined)

            await browser.launchApp()

            expect(appiumLaunchAppSpy).toHaveBeenCalled()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: activateApp'))
        })
    })
})
