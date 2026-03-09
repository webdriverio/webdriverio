import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('sendKeyEvent', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        log.warn = vi.fn()
    })

    it('should throw for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' } as any
        })
        await expect(browser.sendKeyEvent('3')).rejects.toThrow('The `sendKeyEvent` command is only available for mobile platforms.')
    })

    it('should throw for non-Android platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
        })
        await expect(browser.sendKeyEvent('3')).rejects.toThrow('The `sendKeyEvent` command is only available for Android.')
    })

    describe('modern driver', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
            })
        })

        it('should call mobile: pressKey with keycode only', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.sendKeyEvent('3')
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: '3', metastate: undefined })
        })

        it('should call mobile: pressKey with keycode and metastate', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.sendKeyEvent('29', '1')
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: '29', metastate: '1' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.sendKeyEvent('3')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
            })
        })

        it('should fall back to appiumSendKeyEvent and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method'))
            const fallbackSpy = vi.spyOn(browser, 'appiumSendKeyEvent').mockResolvedValue(undefined)
            await browser.sendKeyEvent('3')
            expect(fallbackSpy).toHaveBeenCalledWith('3', undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: pressKey'))
        })

        it('should pass metastate to fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const fallbackSpy = vi.spyOn(browser, 'appiumSendKeyEvent').mockResolvedValue(undefined)
            await browser.sendKeyEvent('29', '1')
            expect(fallbackSpy).toHaveBeenCalledWith('29', '1')
        })
    })
})
