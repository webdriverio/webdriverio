import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getClipboard', () => {
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
            await expect(browser.getClipboard()).rejects.toThrow('The `getClipboard` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: getClipboard succeeds)', () => {
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

        it('should call mobile: getClipboard without contentType', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue('SGVsbG8=')
            const result = await browser.getClipboard()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getClipboard', { contentType: undefined })
            expect(result).toBe('SGVsbG8=')
        })

        it('should call mobile: getClipboard with contentType', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue('SGVsbG8=')
            await browser.getClipboard('plaintext')
            expect(executeSpy).toHaveBeenCalledWith('mobile: getClipboard', { contentType: 'plaintext' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getClipboard()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: getClipboard returns unknown method)', () => {
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

        it('should fall back to appiumGetClipboard and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: getClipboard'))
            const appiumGetClipboardSpy = vi.spyOn(browser, 'appiumGetClipboard').mockResolvedValue('SGVsbG8=')

            await browser.getClipboard('plaintext')

            expect(appiumGetClipboardSpy).toHaveBeenCalledWith('plaintext')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: getClipboard'))
        })

        it('should pass undefined contentType to appiumGetClipboard on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumGetClipboardSpy = vi.spyOn(browser, 'appiumGetClipboard').mockResolvedValue('SGVsbG8=')

            await browser.getClipboard()

            expect(appiumGetClipboardSpy).toHaveBeenCalledWith(undefined)
        })
    })
})
