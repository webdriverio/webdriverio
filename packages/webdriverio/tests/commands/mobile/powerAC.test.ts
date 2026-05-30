import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('powerAC', () => {
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
            await expect(browser.powerAC('on')).rejects.toThrow('The `powerAC` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for non-iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.powerAC('on')).rejects.toThrow('The `powerAC` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: powerAC succeeds)', () => {
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

        it('should call mobile: powerAC with the given state', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.powerAC('on')
            expect(executeSpy).toHaveBeenCalledWith('mobile: powerAC', { state: 'on' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.powerAC('on')).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: powerAC returns unknown method)', () => {
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

        it('should fall back to appiumPowerAC and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: powerAC'))
            const appiumSpy = vi.spyOn(browser, 'appiumPowerAC').mockResolvedValue(undefined)

            await browser.powerAC('on')

            expect(appiumSpy).toHaveBeenCalledWith('on')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: powerAC'))
        })

        it('should pass state to appiumPowerAC on fallback', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumPowerAC').mockResolvedValue(undefined)

            await browser.powerAC('off')

            expect(appiumSpy).toHaveBeenCalledWith('off')
        })
    })
})
