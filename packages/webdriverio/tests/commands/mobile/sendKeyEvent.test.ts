import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('sendKeyEvent', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
    })

    it('should throw for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' } as any
        })
        await expect(browser.sendKeyEvent('3')).rejects.toThrow('The `sendKeyEvent` command is only available for mobile platforms.')
    })

    it('should throw for non-Android platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
        })
        await expect(browser.sendKeyEvent('3')).rejects.toThrow('The `sendKeyEvent` command is only available for Android.')
    })

    describe('modern driver', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
            })
        })

        it('should call mobile: pressKey with integer keycode', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.sendKeyEvent('3')
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: 3 })
        })

        it('should call mobile: pressKey with integer keycode and metastate', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.sendKeyEvent('29', '1')
            expect(executeSpy).toHaveBeenCalledWith('mobile: pressKey', { keycode: 29, metastate: 1 })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.sendKeyEvent('3')).rejects.toThrow('device disconnected')
        })
    })
})
