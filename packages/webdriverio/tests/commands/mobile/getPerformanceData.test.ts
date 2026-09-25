import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('getPerformanceData', () => {
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
            await expect(browser.getPerformanceData('com.example.app', 'cpuinfo')).rejects.toThrow('The `getPerformanceData` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.getPerformanceData('com.example', 'cpuinfo', 5)).rejects.toThrow('The `getPerformanceData` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: getPerformanceData succeeds)', () => {
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

        it('should call mobile: getPerformanceData without timeout', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(['user', '2000'])
            const result = await browser.getPerformanceData('com.example.app', 'cpuinfo')
            expect(executeSpy).toHaveBeenCalledWith('mobile: getPerformanceData', [{
                packageName: 'com.example.app',
                dataType: 'cpuinfo',
                dataReadTimeout: undefined,
            }])
            expect(result).toEqual(['user', '2000'])
        })

        it('should call mobile: getPerformanceData with timeout', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(['user', '2000'])
            await browser.getPerformanceData('com.example.app', 'cpuinfo', 5)
            expect(executeSpy).toHaveBeenCalledWith('mobile: getPerformanceData', [{
                packageName: 'com.example.app',
                dataType: 'cpuinfo',
                dataReadTimeout: 5,
            }])
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getPerformanceData('com.example.app', 'cpuinfo')).rejects.toThrow('device disconnected')
        })
    })
})
