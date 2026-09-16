import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('closeApp', () => {
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
            await expect(browser.closeApp()).rejects.toThrow('The `closeApp` command is only available for mobile platforms.')
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

        it('should auto-detect bundleId and call mobile: terminateApp', async () => {
            vi.spyOn(browser, 'execute')
                .mockResolvedValueOnce({ bundleId: 'com.example.app' })
                .mockResolvedValueOnce(undefined)

            await browser.closeApp()

            expect(browser.execute).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
            expect(browser.execute).toHaveBeenNthCalledWith(2, 'mobile: terminateApp', { bundleId: 'com.example.app' })
        })

        it('should use provided bundleId and call mobile: terminateApp', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

            await browser.closeApp({ bundleId: 'com.example.myapp' })

            expect(executeSpy).toHaveBeenCalledOnce()
            expect(executeSpy).toHaveBeenCalledWith('mobile: terminateApp', { bundleId: 'com.example.myapp' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute')
                .mockResolvedValueOnce({ bundleId: 'com.example.app' })
                .mockRejectedValueOnce(new Error('device disconnected'))
            await expect(browser.closeApp()).rejects.toThrow('device disconnected')
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

        it('should auto-detect appId via getCurrentPackage and call mobile: terminateApp', async () => {
            vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.example.app')
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

            await browser.closeApp()

            expect(browser.getCurrentPackage).toHaveBeenCalledOnce()
            expect(executeSpy).toHaveBeenCalledWith('mobile: terminateApp', { appId: 'com.example.app' })
        })

        it('should use provided appId and call mobile: terminateApp', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

            await browser.closeApp({ appId: 'com.example.myapp' })

            expect(executeSpy).toHaveBeenCalledOnce()
            expect(executeSpy).toHaveBeenCalledWith('mobile: terminateApp', { appId: 'com.example.myapp' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.example.app')
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.closeApp()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: terminateApp returns unknown method)', () => {
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

        it('should fall back to appiumCloseApp and log a warning', async () => {
            vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.example.app')
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: terminateApp'))
            const appiumCloseAppSpy = vi.spyOn(browser, 'appiumCloseApp').mockResolvedValue(undefined)

            await browser.closeApp()

            expect(appiumCloseAppSpy).toHaveBeenCalledWith()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: terminateApp'))
        })

        it('should fall back to appiumCloseApp on unknown command', async () => {
            vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.example.app')
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumCloseAppSpy = vi.spyOn(browser, 'appiumCloseApp').mockResolvedValue(undefined)

            await browser.closeApp()

            expect(appiumCloseAppSpy).toHaveBeenCalledWith()
        })
    })
})
