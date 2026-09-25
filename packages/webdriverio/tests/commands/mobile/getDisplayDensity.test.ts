import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('getDisplayDensity', () => {
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
            await expect(browser.getDisplayDensity()).rejects.toThrow('The `getDisplayDensity` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.getDisplayDensity()).rejects.toThrow('The `getDisplayDensity` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: getDisplayDensity succeeds)', () => {
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

        it('should call mobile: getDisplayDensity and return the density value', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(420)
            const result = await browser.getDisplayDensity()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getDisplayDensity', {})
            expect(result).toBe(420)
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getDisplayDensity()).rejects.toThrow('device disconnected')
        })
    })
})
