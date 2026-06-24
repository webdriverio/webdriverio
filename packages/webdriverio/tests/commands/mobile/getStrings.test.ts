import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getStrings', () => {
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
            await expect(browser.getStrings()).rejects.toThrow('The `getStrings` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: getAppStrings succeeds)', () => {
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

        it('should call mobile: getAppStrings without params', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue({ key: 'value' })
            const result = await browser.getStrings()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getAppStrings', { language: undefined, stringFile: undefined })
            expect(result).toEqual({ key: 'value' })
        })

        it('should call mobile: getAppStrings with language', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue({ key: 'value' })
            await browser.getStrings('fr')
            expect(executeSpy).toHaveBeenCalledWith('mobile: getAppStrings', { language: 'fr', stringFile: undefined })
        })

        it('should call mobile: getAppStrings with language and stringFile', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue({ key: 'value' })
            await browser.getStrings('de', 'strings.xml')
            expect(executeSpy).toHaveBeenCalledWith('mobile: getAppStrings', { language: 'de', stringFile: 'strings.xml' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getStrings()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: getAppStrings returns unknown method)', () => {
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

        it('should fall back to appiumGetStrings and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: getAppStrings'))
            const appiumGetStringsSpy = vi.spyOn(browser, 'appiumGetStrings').mockResolvedValue({ key: 'value' })

            await browser.getStrings('fr')

            expect(appiumGetStringsSpy).toHaveBeenCalledWith('fr', undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: getAppStrings'))
        })

        it('should pass language and stringFile to appiumGetStrings on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumGetStringsSpy = vi.spyOn(browser, 'appiumGetStrings').mockResolvedValue({ key: 'value' })

            await browser.getStrings('de', 'strings.xml')

            expect(appiumGetStringsSpy).toHaveBeenCalledWith('de', 'strings.xml')
        })
    })
})
