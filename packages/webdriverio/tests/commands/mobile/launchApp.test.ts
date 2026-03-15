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

    describe('modern driver on iOS (mobile: launchApp succeeds)', () => {
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

        it('should call mobile: launchApp on iOS', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.launchApp()
            expect(executeSpy).toHaveBeenCalledWith('mobile: launchApp', {})
        })

        it('should re-throw non-unknown-method errors on iOS', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.launchApp()).rejects.toThrow('device disconnected')
        })
    })

    describe('modern driver on Android (mobile: activateApp succeeds)', () => {
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

        it('should call mobile: activateApp on Android', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.launchApp()
            expect(executeSpy).toHaveBeenCalledWith('mobile: activateApp', {})
        })

        it('should re-throw non-unknown-method errors on Android', async () => {
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
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: launchApp'))
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
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumLaunchAppSpy = vi.spyOn(browser, 'appiumLaunchApp').mockResolvedValue(undefined)

            await browser.launchApp()

            expect(appiumLaunchAppSpy).toHaveBeenCalled()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: activateApp'))
        })
    })
})
