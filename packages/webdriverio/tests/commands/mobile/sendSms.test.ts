import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('sendSms', () => {
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
            await expect(browser.sendSms('+15551234567', 'Hello')).rejects.toThrow('The `sendSms` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.sendSms('1234567890', 'Hello')).rejects.toThrow('The `sendSms` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: sendSms succeeds)', () => {
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

        it('should call mobile: sendSms with phoneNumber and message', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.sendSms('+15551234567', 'Hello from the test!')
            expect(executeSpy).toHaveBeenCalledWith('mobile: sendSms', { phoneNumber: '+15551234567', message: 'Hello from the test!' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.sendSms('+15551234567', 'Hello')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: sendSms returns unknown method)', () => {
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

        it('should fall back to appiumSendSms and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: sendSms'))
            const appiumSpy = vi.spyOn(browser, 'appiumSendSms').mockResolvedValue(undefined)

            await browser.sendSms('+15551234567', 'Hello from the test!')

            expect(appiumSpy).toHaveBeenCalledWith('+15551234567', 'Hello from the test!')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: sendSms'))
        })

        it('should pass phoneNumber and message to appiumSendSms on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumSendSms').mockResolvedValue(undefined)

            await browser.sendSms('+15559876543', 'Test message')

            expect(appiumSpy).toHaveBeenCalledWith('+15559876543', 'Test message')
        })
    })
})
