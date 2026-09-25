import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('getCurrentActivity', () => {
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
            await expect(browser.getCurrentActivity()).rejects.toThrow('The `getCurrentActivity` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.getCurrentActivity()).rejects.toThrow('The `getCurrentActivity` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: getCurrentActivity succeeds)', () => {
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

        it('should call mobile: getCurrentActivity and return the activity name', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue('.MainActivity')
            const result = await browser.getCurrentActivity()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getCurrentActivity', {})
            expect(result).toBe('.MainActivity')
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getCurrentActivity()).rejects.toThrow('device disconnected')
        })
    })
})
