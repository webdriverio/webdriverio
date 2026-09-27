import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('getPerformanceDataTypes', () => {
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
            await expect(browser.getPerformanceDataTypes()).rejects.toThrow('The `getPerformanceDataTypes` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.getPerformanceDataTypes()).rejects.toThrow('The `getPerformanceDataTypes` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: getPerformanceDataTypes succeeds)', () => {
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

        it('should call mobile: getPerformanceDataTypes and return the list', async () => {
            const mockTypes = ['cpuinfo', 'memoryinfo', 'batteryinfo', 'networkinfo']
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(mockTypes)
            const result = await browser.getPerformanceDataTypes()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getPerformanceDataTypes', [{}])
            expect(result).toEqual(mockTypes)
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getPerformanceDataTypes()).rejects.toThrow('device disconnected')
        })
    })
})
