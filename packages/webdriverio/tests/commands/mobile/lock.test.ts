import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('lock', () => {
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
            await expect(browser.lock()).rejects.toThrow('The `lock` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: lock succeeds)', () => {
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

        it('should call mobile: lock without seconds', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.lock()
            expect(executeSpy).toHaveBeenCalledWith('mobile: lock', { seconds: undefined })
        })

        it('should call mobile: lock with seconds (iOS)', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.lock(5)
            expect(executeSpy).toHaveBeenCalledWith('mobile: lock', { seconds: 5 })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.lock()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: lock returns unknown method)', () => {
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

        it('should fall back to appiumLock and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: lock'))
            const appiumLockSpy = vi.spyOn(browser, 'appiumLock').mockResolvedValue(undefined)

            await browser.lock()

            expect(appiumLockSpy).toHaveBeenCalledWith(undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: lock'))
        })

        it('should pass seconds to appiumLock on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumLockSpy = vi.spyOn(browser, 'appiumLock').mockResolvedValue(undefined)

            await browser.lock(10)

            expect(appiumLockSpy).toHaveBeenCalledWith(10)
        })
    })
})
