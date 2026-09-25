import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('gsmSignal', () => {
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
            await expect(browser.gsmSignal(4)).rejects.toThrow('The `gsmSignal` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.gsmSignal(4)).rejects.toThrow('The `gsmSignal` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: gsmSignal succeeds)', () => {
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

        it('should call mobile: gsmSignal with signalStrength as a number', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.gsmSignal(4)
            expect(executeSpy).toHaveBeenCalledWith('mobile: gsmSignal', [{ signalStrength: 4 }])
        })

        it('should call mobile: gsmSignal with signalStrength 0', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.gsmSignal(0)
            expect(executeSpy).toHaveBeenCalledWith('mobile: gsmSignal', [{ signalStrength: 0 }])
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.gsmSignal(4)).rejects.toThrow('device disconnected')
        })
    })
})
