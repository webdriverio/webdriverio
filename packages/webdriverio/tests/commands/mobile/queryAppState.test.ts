import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('queryAppState', () => {
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
            await expect(browser.queryAppState('com.example.app')).rejects.toThrow('The `queryAppState` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: queryAppState succeeds)', () => {
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

        it('should call mobile: queryAppState with appId on Android', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(4)
            const result = await browser.queryAppState('com.example.app')
            expect(executeSpy).toHaveBeenCalledWith('mobile: queryAppState', { appId: 'com.example.app', bundleId: undefined })
            expect(result).toBe(4)
        })

        it('should call mobile: queryAppState with bundleId on iOS', async () => {
            const iosBrowser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    platformName: 'iOS',
                } as any
            })
            const executeSpy = vi.spyOn(iosBrowser, 'execute').mockResolvedValue(4)
            const result = await iosBrowser.queryAppState(undefined, 'com.example.app')
            expect(executeSpy).toHaveBeenCalledWith('mobile: queryAppState', { appId: undefined, bundleId: 'com.example.app' })
            expect(result).toBe(4)
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.queryAppState('com.example.app')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: queryAppState returns unknown method)', () => {
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

        it('should fall back to appiumQueryAppState and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: queryAppState'))
            const appiumQueryAppStateSpy = vi.spyOn(browser, 'appiumQueryAppState').mockResolvedValue(4)

            await browser.queryAppState('com.example.app')

            expect(appiumQueryAppStateSpy).toHaveBeenCalledWith('com.example.app', undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: queryAppState'))
        })

        it('should pass bundleId to appiumQueryAppState on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumQueryAppStateSpy = vi.spyOn(browser, 'appiumQueryAppState').mockResolvedValue(4)

            await browser.queryAppState(undefined, 'com.example.app')

            expect(appiumQueryAppStateSpy).toHaveBeenCalledWith(undefined, 'com.example.app')
        })
    })
})
