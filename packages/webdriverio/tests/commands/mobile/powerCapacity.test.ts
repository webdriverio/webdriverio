import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('powerCapacity', () => {
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
            await expect(browser.powerCapacity(75)).rejects.toThrow('The `powerCapacity` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.powerCapacity(50)).rejects.toThrow('The `powerCapacity` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: powerCapacity succeeds)', () => {
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

        it('should call mobile: powerCapacity with the given percent', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.powerCapacity(75)
            expect(executeSpy).toHaveBeenCalledWith('mobile: powerCapacity', { percent: 75 })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.powerCapacity(75)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: powerCapacity returns unknown method)', () => {
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

        it('should fall back to appiumPowerCapacity and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: powerCapacity'))
            const appiumSpy = vi.spyOn(browser, 'appiumPowerCapacity').mockResolvedValue(undefined)

            await browser.powerCapacity(75)

            expect(appiumSpy).toHaveBeenCalledWith(75)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: powerCapacity'))
        })

        it('should pass percent to appiumPowerCapacity on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumPowerCapacity').mockResolvedValue(undefined)

            await browser.powerCapacity(50)

            expect(appiumSpy).toHaveBeenCalledWith(50)
        })
    })
})
