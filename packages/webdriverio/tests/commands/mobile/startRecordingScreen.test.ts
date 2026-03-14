import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('startRecordingScreen', () => {
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
            await expect(browser.startRecordingScreen()).rejects.toThrow('The `startRecordingScreen` command is only available for mobile platforms.')
        })
    })

    describe('Android - modern driver (mobile: startMediaProjectionRecording succeeds)', () => {
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

        it('should call mobile: startMediaProjectionRecording without options', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.startRecordingScreen()
            expect(executeSpy).toHaveBeenCalledWith('mobile: startMediaProjectionRecording', { options: undefined })
        })

        it('should call mobile: startMediaProjectionRecording with options', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            const options = { videoType: 'mp4', videoQuality: 'high', timeLimit: '180' }
            await browser.startRecordingScreen(options)
            expect(executeSpy).toHaveBeenCalledWith('mobile: startMediaProjectionRecording', { options })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.startRecordingScreen()).rejects.toThrow('device disconnected')
        })
    })

    describe('iOS - modern driver (mobile: startXCTestScreenRecording succeeds)', () => {
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

        it('should call mobile: startXCTestScreenRecording without options', async () => {
            const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            await browser.startRecordingScreen()
            expect(executeSpy).toHaveBeenCalledWith('mobile: startXCTestScreenRecording', { options: undefined })
        })
    })

    describe('legacy driver fallback', () => {
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

        it('should fall back to appiumStartRecordingScreen without options and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown method: mobile: startMediaProjectionRecording'))
            const appiumSpy = vi.spyOn(browser, 'appiumStartRecordingScreen').mockResolvedValue(undefined)

            await browser.startRecordingScreen()

            expect(appiumSpy).toHaveBeenCalledWith(undefined)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: startMediaProjectionRecording'))
        })

        it('should fall back to appiumStartRecordingScreen with options and log a warning', async () => {
            vi.spyOn(browser, 'execute').mockRejectedValue(new Error('unknown command'))
            const appiumSpy = vi.spyOn(browser, 'appiumStartRecordingScreen').mockResolvedValue(undefined)
            const options = { videoType: 'mp4', videoQuality: 'high', timeLimit: '180' }

            await browser.startRecordingScreen(options)

            expect(appiumSpy).toHaveBeenCalledWith(options)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('mobile: startMediaProjectionRecording'))
        })
    })
})
