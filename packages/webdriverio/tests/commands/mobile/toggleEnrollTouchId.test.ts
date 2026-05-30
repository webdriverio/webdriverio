import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('toggleEnrollTouchId', () => {
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
            await expect(browser.toggleEnrollTouchId(true)).rejects.toThrow('The `toggleEnrollTouchId` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-Android platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
            })
            await expect(browser.toggleEnrollTouchId(true)).rejects.toThrow('The `toggleEnrollTouchId` command is only available for iOS.')
        })
    })

    describe('modern driver (mobile: enrollBiometric succeeds)', () => {
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

        it('should call mobile: enrollBiometric with enabled=true', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.toggleEnrollTouchId(true)
            expect(executeSpy).toHaveBeenCalledWith('mobile: enrollBiometric', { enabled: true })
        })

        it('should call mobile: enrollBiometric with enabled=false', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.toggleEnrollTouchId(false)
            expect(executeSpy).toHaveBeenCalledWith('mobile: enrollBiometric', { enabled: false })
        })

        it('should call mobile: enrollBiometric without enabled (undefined)', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.toggleEnrollTouchId()
            expect(executeSpy).toHaveBeenCalledWith('mobile: enrollBiometric', { enabled: undefined })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.toggleEnrollTouchId(true)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: enrollBiometric returns unknown method)', () => {
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

        it('should fall back to appiumToggleEnrollTouchId and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: enrollBiometric'))
            const appiumSpy = vi.spyOn(browser, 'appiumToggleEnrollTouchId').mockResolvedValue(undefined)

            await browser.toggleEnrollTouchId(true)

            expect(appiumSpy).toHaveBeenCalledWith(true)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: enrollBiometric'))
        })

        it('should pass enabled=false to appiumToggleEnrollTouchId on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumToggleEnrollTouchId').mockResolvedValue(undefined)

            await browser.toggleEnrollTouchId(false)

            expect(appiumSpy).toHaveBeenCalledWith(false)
        })
    })
})
