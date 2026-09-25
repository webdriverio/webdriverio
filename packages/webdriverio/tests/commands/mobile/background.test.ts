import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('background', () => {
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
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.background(5)
            expect(executeSpy).toHaveBeenCalledWith('mobile: backgroundApp', [{ seconds: 5 }])
        })

        it('should call mobile: backgroundApp with -1 for indefinite background', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.background(-1)
            expect(executeSpy).toHaveBeenCalledWith('mobile: backgroundApp', [{ seconds: -1 }])
        })

        it('should call mobile: backgroundApp with null to not restore', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
            await browser.background(null)
            expect(executeSpy).toHaveBeenCalledWith('mobile: backgroundApp', [{ seconds: null }])
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.background(5)).rejects.toThrow('device disconnected')
        })
    })
})
