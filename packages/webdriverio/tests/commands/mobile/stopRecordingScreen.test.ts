import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('stopRecordingScreen', () => {
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
            await expect(browser.stopRecordingScreen()).rejects.toThrow('The `stopRecordingScreen` command is only available for mobile platforms.')
        })
    })

    describe('modern driver (mobile: stopRecordingScreen succeeds)', () => {
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

        it('should call mobile: stopRecordingScreen without arguments', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue('base64video')
            const result = await browser.stopRecordingScreen()
            expect(executeSpy).toHaveBeenCalledWith('mobile: stopRecordingScreen', {
                remotePath: undefined,
                username: undefined,
                password: undefined,
                method: undefined,
            })
            expect(result).toBe('base64video')
        })

        it('should call mobile: stopRecordingScreen with all arguments', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue('')
            const result = await browser.stopRecordingScreen('https://storage.example.com/video.mp4', 'user', 'pass', 'PUT')
            expect(executeSpy).toHaveBeenCalledWith('mobile: stopRecordingScreen', {
                remotePath: 'https://storage.example.com/video.mp4',
                username: 'user',
                password: 'pass',
                method: 'PUT',
            })
            expect(result).toBe('')
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.stopRecordingScreen()).rejects.toThrow('device disconnected')
        })
    })

    describe('legacy driver fallback (mobile: stopRecordingScreen returns unknown method)', () => {
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

        it('should fall back to appiumStopRecordingScreen without arguments and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: stopRecordingScreen'))
            const appiumSpy = vi.spyOn(browser, 'appiumStopRecordingScreen').mockResolvedValue('base64video')

            const result = await browser.stopRecordingScreen()

            expect(appiumSpy).toHaveBeenCalledWith(undefined, undefined, undefined, undefined)
            expect(result).toBe('base64video')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: stopRecordingScreen'))
        })

        it('should fall back to appiumStopRecordingScreen with all arguments and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumStopRecordingScreen').mockResolvedValue('')

            const result = await browser.stopRecordingScreen('https://storage.example.com/video.mp4', 'user', 'pass', 'PUT')

            expect(appiumSpy).toHaveBeenCalledWith('https://storage.example.com/video.mp4', 'user', 'pass', 'PUT')
            expect(result).toBe('')
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: stopRecordingScreen'))
        })
    })
})
