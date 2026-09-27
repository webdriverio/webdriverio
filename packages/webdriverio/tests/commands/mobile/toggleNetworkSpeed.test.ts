import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('toggleNetworkSpeed', () => {
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
            await expect(browser.toggleNetworkSpeed('lte')).rejects.toThrow('The `toggleNetworkSpeed` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.toggleNetworkSpeed('full')).rejects.toThrow('The `toggleNetworkSpeed` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: networkSpeed succeeds)', () => {
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

        it('should call mobile: networkSpeed with the given netspeed', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.toggleNetworkSpeed('lte')
            expect(executeSpy).toHaveBeenCalledWith('mobile: networkSpeed', [{ netspeed: 'lte' }])
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.toggleNetworkSpeed('lte')).rejects.toThrow('device disconnected')
        })
    })
})
