import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('getStrings', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
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
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue({ key: 'value' })
            const result = await browser.getStrings()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getAppStrings', [{ language: undefined, stringFile: undefined }])
            expect(result).toEqual({ key: 'value' })
        })

        it('should call mobile: getAppStrings with language', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue({ key: 'value' })
            await browser.getStrings('fr')
            expect(executeSpy).toHaveBeenCalledWith('mobile: getAppStrings', [{ language: 'fr', stringFile: undefined }])
        })

        it('should call mobile: getAppStrings with language and stringFile', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue({ key: 'value' })
            await browser.getStrings('de', 'strings.xml')
            expect(executeSpy).toHaveBeenCalledWith('mobile: getAppStrings', [{ language: 'de', stringFile: 'strings.xml' }])
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getStrings()).rejects.toThrow('device disconnected')
        })
    })
})
