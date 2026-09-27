import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('toggleAirplaneMode', () => {
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
            await expect(browser.toggleAirplaneMode(true)).rejects.toThrow('The `toggleAirplaneMode` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.toggleAirplaneMode(true)).rejects.toThrow('The `toggleAirplaneMode` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: setConnectivity succeeds)', () => {
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

        it('should call mobile: setConnectivity with airplaneMode=true', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.toggleAirplaneMode(true)
            expect(executeSpy).toHaveBeenCalledWith('mobile: setConnectivity', [{ airplaneMode: true }])
        })

        it('should call mobile: setConnectivity with airplaneMode=false', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.toggleAirplaneMode(false)
            expect(executeSpy).toHaveBeenCalledWith('mobile: setConnectivity', [{ airplaneMode: false }])
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.toggleAirplaneMode(true)).rejects.toThrow('device disconnected')
        })
    })
})
