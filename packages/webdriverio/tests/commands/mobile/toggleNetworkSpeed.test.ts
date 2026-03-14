import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('toggleNetworkSpeed', () => {
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
            await expect(browser.toggleNetworkSpeed('lte')).rejects.toThrow('The `toggleNetworkSpeed` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.toggleNetworkSpeed('full')).rejects.toThrow('The `toggleNetworkSpeed` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: networkSpeed succeeds)', () => {
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

        it('should call mobile: networkSpeed with the given netspeed', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.toggleNetworkSpeed('lte')
            expect(executeSpy).toHaveBeenCalledWith('mobile: networkSpeed', { netspeed: 'lte' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.toggleNetworkSpeed('lte')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: networkSpeed returns unknown method)', () => {
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

        it('should fall back to appiumToggleNetworkSpeed and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: networkSpeed'))
            const appiumSpy = vi.spyOn(browser, 'appiumToggleNetworkSpeed').mockResolvedValue(undefined)

            await browser.toggleNetworkSpeed('lte')

            expect(appiumSpy).toHaveBeenCalledWith('lte')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: networkSpeed'))
        })

        it('should pass netspeed to appiumToggleNetworkSpeed on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumToggleNetworkSpeed').mockResolvedValue(undefined)

            await browser.toggleNetworkSpeed('gsm')

            expect(appiumSpy).toHaveBeenCalledWith('gsm')
        })
    })
})
