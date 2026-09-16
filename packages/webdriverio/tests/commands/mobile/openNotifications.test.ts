import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('openNotifications', () => {
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
            await expect(browser.openNotifications()).rejects.toThrow('The `openNotifications` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.openNotifications()).rejects.toThrow('The `openNotifications` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: openNotifications succeeds)', () => {
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

        it('should call mobile: openNotifications with no args', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.openNotifications()
            expect(executeSpy).toHaveBeenCalledWith('mobile: openNotifications', {})
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.openNotifications()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: openNotifications returns unknown method)', () => {
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

        it('should fall back to appiumOpenNotifications and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: openNotifications'))
            const appiumOpenNotificationsSpy = vi.spyOn(browser, 'appiumOpenNotifications').mockResolvedValue(undefined)

            await browser.openNotifications()

            expect(appiumOpenNotificationsSpy).toHaveBeenCalledWith()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: openNotifications'))
        })

        it('should fall back to appiumOpenNotifications on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumOpenNotificationsSpy = vi.spyOn(browser, 'appiumOpenNotifications').mockResolvedValue(undefined)

            await browser.openNotifications()

            expect(appiumOpenNotificationsSpy).toHaveBeenCalledWith()
        })
    })
})
