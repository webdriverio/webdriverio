import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getPerformanceDataTypes', () => {
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
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(mockTypes)
            const result = await browser.getPerformanceDataTypes()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getPerformanceDataTypes', {})
            expect(result).toEqual(mockTypes)
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getPerformanceDataTypes()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: getPerformanceDataTypes returns unknown method)', () => {
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

        it('should fall back to appiumGetPerformanceDataTypes and log a warning', async () => {
            const mockTypes = ['cpuinfo', 'memoryinfo']
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: getPerformanceDataTypes'))
            const appiumGetPerformanceDataTypesSpy = vi.spyOn(browser, 'appiumGetPerformanceDataTypes').mockResolvedValue(mockTypes)

            const result = await browser.getPerformanceDataTypes()

            expect(appiumGetPerformanceDataTypesSpy).toHaveBeenCalledWith()
            expect(result).toEqual(mockTypes)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: getPerformanceDataTypes'))
        })

        it('should fall back to appiumGetPerformanceDataTypes on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumGetPerformanceDataTypesSpy = vi.spyOn(browser, 'appiumGetPerformanceDataTypes').mockResolvedValue(['batteryinfo'])

            const result = await browser.getPerformanceDataTypes()

            expect(appiumGetPerformanceDataTypesSpy).toHaveBeenCalledWith()
            expect(result).toEqual(['batteryinfo'])
        })
    })
})
