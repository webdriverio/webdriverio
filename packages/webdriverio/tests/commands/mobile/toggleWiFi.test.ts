import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('toggleWiFi', () => {
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
            await expect(browser.toggleWiFi(true)).rejects.toThrow('The `toggleWiFi` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.toggleWiFi(true)).rejects.toThrow('The `toggleWiFi` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: setConnectivity succeeds)', () => {
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

        it('should call mobile: setConnectivity with wifi=true', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.toggleWiFi(true)
            expect(executeSpy).toHaveBeenCalledWith('mobile: setConnectivity', { wifi: true })
        })

        it('should call mobile: setConnectivity with wifi=false', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.toggleWiFi(false)
            expect(executeSpy).toHaveBeenCalledWith('mobile: setConnectivity', { wifi: false })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.toggleWiFi(true)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: setConnectivity returns unknown method)', () => {
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

        it('should fall back to appiumToggleWiFi and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: setConnectivity'))
            const appiumSpy = vi.spyOn(browser, 'appiumToggleWiFi').mockResolvedValue(undefined)

            await browser.toggleWiFi(true)

            expect(appiumSpy).toHaveBeenCalled()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: setConnectivity'))
        })

        it('should fall back to appiumToggleWiFi on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumToggleWiFi').mockResolvedValue(undefined)

            await browser.toggleWiFi(false)

            expect(appiumSpy).toHaveBeenCalled()
        })
    })
})
