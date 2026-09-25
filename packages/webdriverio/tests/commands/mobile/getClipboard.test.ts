import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('getClipboard', () => {
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
            await expect(browser.getClipboard()).rejects.toThrow('The `getClipboard` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: getClipboard succeeds)', () => {
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

        it('should call mobile: getClipboard without contentType', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue('SGVsbG8=')
            const result = await browser.getClipboard()
            expect(executeSpy).toHaveBeenCalledWith('mobile: getClipboard', [{ contentType: undefined }])
            expect(result).toBe('SGVsbG8=')
        })

        it('should call mobile: getClipboard with contentType', async () => {
            const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue('SGVsbG8=')
            await browser.getClipboard('plaintext')
            expect(executeSpy).toHaveBeenCalledWith('mobile: getClipboard', [{ contentType: 'plaintext' }])
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.getClipboard()).rejects.toThrow('device disconnected')
        })
    })
})
