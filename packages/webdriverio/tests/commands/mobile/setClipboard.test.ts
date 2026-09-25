import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('setClipboard', () => {
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
            await expect(browser.setClipboard('SGVsbG8=')).rejects.toThrow('The `setClipboard` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: setClipboard succeeds)', () => {
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

        it('should call mobile: setClipboard with content only', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.setClipboard('SGVsbG8=')
            expect(executeSpy).toHaveBeenCalledWith('mobile: setClipboard', { content: 'SGVsbG8=', contentType: undefined, label: undefined })
        })

        it('should call mobile: setClipboard with content and contentType', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.setClipboard('SGVsbG8=', 'plaintext')
            expect(executeSpy).toHaveBeenCalledWith('mobile: setClipboard', { content: 'SGVsbG8=', contentType: 'plaintext', label: undefined })
        })

        it('should call mobile: setClipboard with all params', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.setClipboard('SGVsbG8=', 'plaintext', 'myLabel')
            expect(executeSpy).toHaveBeenCalledWith('mobile: setClipboard', { content: 'SGVsbG8=', contentType: 'plaintext', label: 'myLabel' })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.setClipboard('SGVsbG8=')).rejects.toThrow('device disconnected')
        })
    })
})
