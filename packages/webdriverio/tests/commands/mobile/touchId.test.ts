import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('touchId', () => {
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
            await expect(browser.touchId(true)).rejects.toThrow('The `touchId` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for Android platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
            })
            await expect(browser.touchId(true)).rejects.toThrow('The `touchId` command is only available for iOS. For Android, use `fingerPrint` instead.')
        })
    })

    describe('modern driver (mobile: sendBiometricMatch succeeds)', () => {
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

        it('should call mobile: sendBiometricMatch with match=true and default type touchId', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.touchId(true)
            expect(executeSpy).toHaveBeenCalledWith('mobile: sendBiometricMatch', { match: true, type: 'touchId' })
        })

        it('should call mobile: sendBiometricMatch with match=false and default type touchId', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.touchId(false)
            expect(executeSpy).toHaveBeenCalledWith('mobile: sendBiometricMatch', { match: false, type: 'touchId' })
        })

        it('should call mobile: sendBiometricMatch with type faceId', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.touchId(true, 'faceId')
            expect(executeSpy).toHaveBeenCalledWith('mobile: sendBiometricMatch', { match: true, type: 'faceId' })
        })

        it('should call mobile: sendBiometricMatch with match=false and type faceId', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.touchId(false, 'faceId')
            expect(executeSpy).toHaveBeenCalledWith('mobile: sendBiometricMatch', { match: false, type: 'faceId' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.touchId(true)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: sendBiometricMatch returns unknown method)', () => {
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

        it('should fall back to appiumTouchId with match and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: sendBiometricMatch'))
            const appiumTouchIdSpy = vi.spyOn(browser, 'appiumTouchId').mockResolvedValue(undefined)

            await browser.touchId(true)

            expect(appiumTouchIdSpy).toHaveBeenCalledWith(true)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: sendBiometricMatch'))
        })

        it('should pass match=false to appiumTouchId on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumTouchIdSpy = vi.spyOn(browser, 'appiumTouchId').mockResolvedValue(undefined)

            await browser.touchId(false)

            expect(appiumTouchIdSpy).toHaveBeenCalledWith(false)
        })
    })
})
