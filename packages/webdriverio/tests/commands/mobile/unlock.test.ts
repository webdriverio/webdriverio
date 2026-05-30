import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('unlock', () => {
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
            await expect(browser.unlock()).rejects.toThrow('The `unlock` command is only available for mobile platforms.')
        })
    })

    describe('iOS (mobile: unlock succeeds)', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    platformName: 'iOS',
                } as any
            })
        })

        it('should call mobile: unlock with no args on iOS', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.unlock()
            expect(executeSpy).toHaveBeenCalledWith('mobile: unlock', {})
        })

        it('should ignore Android-specific options on iOS', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.unlock({ strategy: 'locksettings', unlockKey: '1234' })
            expect(executeSpy).toHaveBeenCalledWith('mobile: unlock', {})
        })
    })

    describe('Android (mobile: unlock succeeds)', () => {
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

        it('should call mobile: unlock with no args when no options provided', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.unlock()
            expect(executeSpy).toHaveBeenCalledWith('mobile: unlock', {})
        })

        it('should call mobile: unlock with strategy option', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.unlock({ strategy: 'locksettings' })
            expect(executeSpy).toHaveBeenCalledWith('mobile: unlock', { strategy: 'locksettings' })
        })

        it('should call mobile: unlock with all Android options', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.unlock({
                strategy: 'uiautomator',
                timeoutMs: 5000,
                unlockKey: '1234',
                unlockType: 'pin',
            })
            expect(executeSpy).toHaveBeenCalledWith('mobile: unlock', {
                strategy: 'uiautomator',
                timeoutMs: 5000,
                unlockKey: '1234',
                unlockType: 'pin',
            })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.unlock()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: unlock returns unknown method)', () => {
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

        it('should fall back to appiumUnlock and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: unlock'))
            const appiumUnlockSpy = vi.spyOn(browser, 'appiumUnlock').mockResolvedValue(undefined)

            await browser.unlock()

            expect(appiumUnlockSpy).toHaveBeenCalledWith()
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: unlock'))
        })

        it('should fall back to appiumUnlock on unknown command', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumUnlockSpy = vi.spyOn(browser, 'appiumUnlock').mockResolvedValue(undefined)

            await browser.unlock({ strategy: 'locksettings', unlockKey: '1234' })

            expect(appiumUnlockSpy).toHaveBeenCalledWith()
        })
    })
})
