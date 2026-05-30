import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('background', () => {
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
            await expect(browser.background(5)).rejects.toThrow('The `background` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: backgroundApp succeeds)', () => {
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

        it('should call mobile: backgroundApp with seconds', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.background(5)
            expect(executeSpy).toHaveBeenCalledWith('mobile: backgroundApp', { seconds: 5 })
        })

        it('should call mobile: backgroundApp with -1 for indefinite background', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.background(-1)
            expect(executeSpy).toHaveBeenCalledWith('mobile: backgroundApp', { seconds: -1 })
        })

        it('should call mobile: backgroundApp with null to not restore', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.background(null)
            expect(executeSpy).toHaveBeenCalledWith('mobile: backgroundApp', { seconds: null })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.background(5)).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: backgroundApp returns unknown method)', () => {
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

        it('should fall back to appiumBackground and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: backgroundApp'))
            const appiumBackgroundSpy = vi.spyOn(browser, 'appiumBackground').mockResolvedValue(undefined)

            await browser.background(5)

            expect(appiumBackgroundSpy).toHaveBeenCalledWith(5)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: backgroundApp'))
        })

        it('should pass null to appiumBackground on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumBackgroundSpy = vi.spyOn(browser, 'appiumBackground').mockResolvedValue(undefined)

            await browser.background(null)

            expect(appiumBackgroundSpy).toHaveBeenCalledWith(null)
        })
    })
})
