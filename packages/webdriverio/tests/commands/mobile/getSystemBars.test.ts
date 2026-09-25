import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('getSystemBars', () => {
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
            await expect(browser.getSystemBars()).rejects.toThrow('The `getSystemBars` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.getSystemBars()).rejects.toThrow('The `getSystemBars` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: getSystemBars succeeds)', () => {
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

        it('should call mobile: getSystemBars and return bar info', async () => {
            const mockBars = { statusBar: { visible: true }, navigationBar: { visible: true } }
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(mockBars)
            const result = await browser.getSystemBars()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getSystemBars', {})
            expect(result).toEqual(mockBars)
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getSystemBars()).rejects.toThrow('device disconnected')
        })
    })
})
