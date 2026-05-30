import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setClipboard', () => {
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
            await expect(browser.setClipboard('SGVsbG8=')).rejects.toThrow('The `setClipboard` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: setClipboard succeeds)', () => {
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

        it('should call mobile: setClipboard with content only', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.setClipboard('SGVsbG8=')
            expect(executeSpy).toHaveBeenCalledWith('mobile: setClipboard', { content: 'SGVsbG8=', contentType: undefined, label: undefined })
        })

        it('should call mobile: setClipboard with content and contentType', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.setClipboard('SGVsbG8=', 'plaintext')
            expect(executeSpy).toHaveBeenCalledWith('mobile: setClipboard', { content: 'SGVsbG8=', contentType: 'plaintext', label: undefined })
        })

        it('should call mobile: setClipboard with all params', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.setClipboard('SGVsbG8=', 'plaintext', 'myLabel')
            expect(executeSpy).toHaveBeenCalledWith('mobile: setClipboard', { content: 'SGVsbG8=', contentType: 'plaintext', label: 'myLabel' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.setClipboard('SGVsbG8=')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: setClipboard returns unknown method)', () => {
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

        it('should fall back to appiumSetClipboard and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: setClipboard'))
            const appiumSetClipboardSpy = vi.spyOn(browser, 'appiumSetClipboard').mockResolvedValue(undefined)

            await browser.setClipboard('SGVsbG8=', 'plaintext')

            expect(appiumSetClipboardSpy).toHaveBeenCalledWith('SGVsbG8=', 'plaintext', undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: setClipboard'))
        })

        it('should pass all params to appiumSetClipboard on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSetClipboardSpy = vi.spyOn(browser, 'appiumSetClipboard').mockResolvedValue(undefined)

            await browser.setClipboard('SGVsbG8=', 'plaintext', 'myLabel')

            expect(appiumSetClipboardSpy).toHaveBeenCalledWith('SGVsbG8=', 'plaintext', 'myLabel')
        })
    })
})
