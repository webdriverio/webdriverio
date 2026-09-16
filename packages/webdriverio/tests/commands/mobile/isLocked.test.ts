import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isLocked', () => {
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
            await expect(browser.isLocked()).rejects.toThrow('The `isLocked` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: isLocked succeeds)', () => {
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

        it('should call mobile: isLocked and return true when locked', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(true)
            const result = await browser.isLocked()
            expect(executeSpy).toHaveBeenCalledWith('mobile: isLocked', {})
            expect(result).toBe(true)
        })

        it('should call mobile: isLocked and return false when unlocked', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(false)
            const result = await browser.isLocked()
            expect(executeSpy).toHaveBeenCalledWith('mobile: isLocked', {})
            expect(result).toBe(false)
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.isLocked()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: isLocked returns unknown method)', () => {
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

        it('should fall back to appiumIsLocked and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: isLocked'))
            const appiumIsLockedSpy = vi.spyOn(browser, 'appiumIsLocked').mockResolvedValue(true)

            const result = await browser.isLocked()

            expect(appiumIsLockedSpy).toHaveBeenCalledWith()
            expect(result).toBe(true)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: isLocked'))
        })

        it('should fall back to appiumIsLocked on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumIsLockedSpy = vi.spyOn(browser, 'appiumIsLocked').mockResolvedValue(false)

            const result = await browser.isLocked()

            expect(appiumIsLockedSpy).toHaveBeenCalledWith()
            expect(result).toBe(false)
        })
    })
})
