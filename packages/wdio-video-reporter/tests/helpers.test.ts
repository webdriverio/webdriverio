import fs from 'node:fs'
import path from 'node:path'

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import {
    sleep, generateFilename, getVideoPath, getVideoFormatSettings, waitForVideosToExist,
    waitForVideosToBeWritten, pad, getCurrentCapabilities, getBidiSnapshotCommand, getScreenshotBrowser
} from '../src/helpers.js'
import { DEFAULT_OPTIONS, SUPPORTED_VIDEO_FORMATS } from '../src/constants.js'

vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(),
        statSync: vi.fn().mockReturnValue({ size: 512 })
    }
}))

describe('sleep', () => {
    it('should block the event loop', () => {
        const now = Date.now()
        sleep(100)

        // a slow CI machine can sleep longer, never shorter
        expect(Date.now() - now).toBeGreaterThanOrEqual(100)
        expect(Date.now() - now).toBeLessThan(5000)
    })
})

describe('generateFilename - ', () => {
    const name = 'DESCRIBE-TEST'
    const browser = 'BROWSER'
    const date = '09-04-1989--11-22-33-044'
    const maxTestNameCharacters = DEFAULT_OPTIONS.maxTestNameCharacters

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(1989, 8, 4, 11, 22, 33, 44))
        /**
         * `generateFilename` calls `toLocaleString('iso', ...)`. 'iso' is not a
         * real locale, so the system locale formats the date. Use en-US so the
         * result does not depend on the machine.
         */
        const toLocaleString = Date.prototype.toLocaleString
        vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function (this: Date, _locales, options) {
            return toLocaleString.call(this, 'en-US', options)
        })
    })

    afterEach(() => {
        vi.mocked(Date.prototype.toLocaleString).mockRestore()
    })

    afterAll(() => {
        vi.useRealTimers()
    })

    it('should generate name in form: name--browser--date', () => {
        expect(generateFilename(maxTestNameCharacters, browser, name))
            .toBe(`${name}--${browser}--${date}`)
    })

    it('should replace space with -', () => {
        const testname = name + ' space'
        expect(generateFilename(maxTestNameCharacters, browser, testname))
            .toBe(`${name}-space--${browser}--${date}`)
    })

    it('should replace . with -', () => {
        const testname = name + '.dot'
        expect(generateFilename(maxTestNameCharacters, browser, testname))
            .toBe(`${name}-dot--${browser}--${date}`)
    })

    it('should remove characters: /?<>\\/:*|"()[]\'<>%', () => {
        const testname = name + '-/?<>\\/:*|"()[]\'<>%comment/'
        expect(generateFilename(maxTestNameCharacters, browser, testname))
            .toBe(`${name}-comment--${browser}--${date}`)
    })

    it('should keep filenames <= config.maxTestNameCharacters', () => {
        const sixtyFourChars = '1234567890123456789012345678901234567890123456789012345678901234'
        const testname256 = sixtyFourChars + sixtyFourChars + sixtyFourChars + sixtyFourChars
        expect(generateFilename(maxTestNameCharacters, browser, testname256).length)
            .toBe(maxTestNameCharacters)
    })

    it('should keep filenames <= config.maxTestNameCharacters with variable maxTestNameCharacters', () => {
        const sixtyFourChars = '1234567890123456789012345678901234567890123456789012345678901234'
        const testname256 = sixtyFourChars + sixtyFourChars + sixtyFourChars + sixtyFourChars
        expect(generateFilename(16, browser, testname256).length).toBe(16)
    })

    /**
   * This test is skipped because it is not possible to keep filenames unique
   * ToDo(Christian): either remove test or find out why it fails
   */
    it.skip('should keep truncated filenames unique', () => {
        const sixtyFourChars = '1234567890123456789012345678901234567890123456789012345678901234'
        const testname256 = sixtyFourChars + sixtyFourChars + sixtyFourChars + sixtyFourChars
        const name1 = generateFilename(maxTestNameCharacters, browser, testname256)
        const name2 = generateFilename(maxTestNameCharacters, browser, testname256)
        expect(name1).not.toBe(name2)
    })
})

describe('getVideoPath', () => {
    it('should return path to video', () => {
        const basePath = `${path.sep}foo${path.sep}bar${path.sep}outputDir`
        expect(getVideoPath(basePath, 'testName', 'mp4'))
            .toEqual(expect.stringContaining(`${path.sep}foo${path.sep}bar${path.sep}outputDir${path.sep}testName.mp4`))
    })
})

describe('getVideoFormatSettings', () => {
    it('should return video format settings', () => {
        expect(getVideoFormatSettings('mp4')).toEqual(SUPPORTED_VIDEO_FORMATS['mp4'])
    })
})

describe('waitForVideos - ', () => {
    const videos = ['file1.mp4', 'file2.mp4', 'file3.mp4']
    const videoRenderTimeout = 5 * 1000

    it('should wait for videos to exist', async () => {
        vi.mocked(fs.existsSync)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementation(() => true)
        const sleepMock = vi.fn().mockImplementation(sleep)
        expect(waitForVideosToExist(videos, videoRenderTimeout, sleepMock)).toBe(true)
        expect(sleepMock).toBeCalledTimes(2)
    })

    it('should wait for videos to be generated', async () => {
        vi.mocked(fs.existsSync).mockImplementation(() => true)
        vi.mocked(fs.statSync)
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementation(() => ({ size: 512 } as any))
        const sleepMock = vi.fn().mockImplementation(sleep)
        expect(waitForVideosToExist(videos, videoRenderTimeout, sleepMock)).toBe(true)
        expect(sleepMock).toBeCalledTimes(2)
    })

    it('should wait for videos to be exist and be generated', async () => {
        vi.mocked(fs.existsSync)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementation(() => true)
        vi.mocked(fs.statSync)
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementation(() => ({ size: 512 } as any))
        const sleepMock = vi.fn().mockImplementation(sleep)
        expect(waitForVideosToExist(videos, videoRenderTimeout, sleepMock)).toBe(true)
        expect(sleepMock).toBeCalledTimes(4)
    })

    it('should bail after abortTime even if not existing', async () => {
        vi.mocked(fs.existsSync)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementation(() => true)
        vi.mocked(fs.statSync)
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementationOnce(() => ({ size: 48 } as any))
            .mockImplementation(() => ({ size: 512 } as any))
        const sleepMock = vi.fn().mockImplementation(sleep)
        expect(waitForVideosToExist(videos, 300, sleepMock)).toBe(false)
        expect(sleepMock).toBeCalledTimes(3)
    })
})

describe('waitForVideosToBeWritten', () => {
    const videos = ['file1.mp4', 'file2.mp4', 'file3.mp4']
    const videoRenderTimeout = 5 * 1000

    /**
     * fake clock: time moves only when the function sleeps, so the result does
     * not depend on the speed of the machine
     */
    let now = 0
    const fakeSleep = (ms: number) => {
        now += ms
    }
    beforeEach(() => {
        now = 0
        vi.spyOn(Date, 'now').mockImplementation(() => now)
    })
    afterEach(() => {
        vi.mocked(Date.now).mockRestore()
    })

    it('should wait for videos to finish being written', async () => {
        vi.mocked(fs.statSync)
            .mockImplementationOnce(() => ({ size: 50 } as any))
            .mockImplementationOnce(() => ({ size: 61 } as any))
            .mockImplementationOnce(() => ({ size: 72 } as any))
            .mockImplementationOnce(() => ({ size: 51 } as any))
            .mockImplementationOnce(() => ({ size: 62 } as any))
            .mockImplementationOnce(() => ({ size: 73 } as any))
            .mockImplementation(() => ({ size: 512 } as any))
        const sleepMock = vi.fn().mockImplementation(fakeSleep)
        expect(waitForVideosToBeWritten(videos, videoRenderTimeout, sleepMock)).toBe(true)
        expect(sleepMock).toBeCalledTimes(3)
    })

    it('should wait for videos to finish being written and bail if timeout is reached', async () => {
        vi.mocked(fs.statSync)
            .mockImplementationOnce(() => ({ size: 50 } as any))
            .mockImplementationOnce(() => ({ size: 61 } as any))
            .mockImplementationOnce(() => ({ size: 72 } as any))
            .mockImplementationOnce(() => ({ size: 51 } as any))
            .mockImplementationOnce(() => ({ size: 62 } as any))
            .mockImplementationOnce(() => ({ size: 73 } as any))
            .mockImplementation(() => ({ size: 512 } as any))
        const sleepMock = vi.fn().mockImplementation(fakeSleep)
        expect(waitForVideosToBeWritten(videos, 150, sleepMock)).toBe(false)
        expect(sleepMock).toBeCalledTimes(2)
    })
})

describe('getBidiSnapshotCommand', () => {
    it.each([
        ['browsingContext.navigate', {}, 'url'],
        ['browsingContext.reload', {}, 'refresh'],
        ['browsingContext.traverseHistory', { delta: -1 }, 'back'],
        ['browsingContext.traverseHistory', { delta: 1 }, 'forward'],
        ['script.callFunction', {}, undefined],
        ['input.performActions', {}, 'actions'],
        ['browsingContext.captureScreenshot', {}, undefined],
        ['session.subscribe', {}, undefined]
    ])('maps %s %j to %s', (method, params, expected) => {
        expect(getBidiSnapshotCommand({ method, params })).toBe(expected)
    })
})

describe('pad', () => {
    it('should pad number with 0', () => {
        expect(pad(11)).toBe('0011')
    })

    it('should not pad number if already long enough', () => {
        expect(pad(1111)).toBe('1111')
    })
})

describe('getCurrentCapabilities', () => {
    it('should return capabilities', () => {
        const caps: any = { browserName: 'chrome' }
        const browser: any = {
            capabilities: caps
        }
        const w3cBrowser: any = {
            capabilities: {
                alwaysMatch: caps
            }
        }
        expect(getCurrentCapabilities(browser)).toEqual(caps)
        expect(getCurrentCapabilities(w3cBrowser)).toEqual(caps)
    })

    it('should return the capabilities of the first instance of a multi-remote browser', () => {
        const caps: any = { browserName: 'chrome' }
        const instanceA: any = { capabilities: caps }
        const mrBrowser: any = {
            isMultiRemote: true,
            instances: ['browserA', 'browserB'],
            getInstance: (name: string) => name === 'browserA' ? instanceA : { capabilities: { browserName: 'firefox' } }
        }
        expect(getCurrentCapabilities(mrBrowser)).toEqual(caps)
        expect(getScreenshotBrowser(mrBrowser)).toBe(instanceA)
    })

    it('should use the browser itself for screenshots if it is not multi-remote', () => {
        const browser: any = { capabilities: {} }
        expect(getScreenshotBrowser(browser)).toBe(browser)
    })
})
