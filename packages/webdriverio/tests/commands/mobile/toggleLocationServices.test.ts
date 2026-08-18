import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('toggleLocationServices', () => {
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
            await expect(browser.toggleLocationServices()).rejects.toThrow('The `toggleLocationServices` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.toggleLocationServices(true)).rejects.toThrow('The `toggleLocationServices` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: toggleGps succeeds)', () => {
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

        it('should call mobile: toggleGps with no args', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.toggleLocationServices()
            expect(executeSpy).toHaveBeenCalledWith('mobile: toggleGps', {})
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.toggleLocationServices()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: toggleGps returns unknown method)', () => {
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

        it('should fall back to appiumToggleLocationServices and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: toggleGps'))
            const appiumToggleLocationServicesSpy = vi.spyOn(browser, 'appiumToggleLocationServices').mockResolvedValue(undefined)

            await browser.toggleLocationServices()

            expect(appiumToggleLocationServicesSpy).toHaveBeenCalledWith()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: toggleGps'))
        })

        it('should fall back to appiumToggleLocationServices on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumToggleLocationServicesSpy = vi.spyOn(browser, 'appiumToggleLocationServices').mockResolvedValue(undefined)

            await browser.toggleLocationServices()

            expect(appiumToggleLocationServicesSpy).toHaveBeenCalledWith()
        })
    })
})
