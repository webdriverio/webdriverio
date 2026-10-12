import fs from 'node:fs'
import path from 'node:path'

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { browser } from '@wdio/globals'
import AllureReporterExtension from '../src/allure.js'
import VideoReporter from '../src/index.js'

vi.mock('node:fs', () => {
    const mod = {
        writeFileSync: vi.fn(),
        createWriteStream: vi.fn(),
        mkdirSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(false),
    }
    return {
        ...mod,
        default: mod
    }
})

vi.mock('node:fs/promises', () => ({}))

vi.mock('glob', () => ({
    glob: () => Promise.resolve(['/foo/bar.js', '/foo/baz.js'])
}))

vi.mock('@ffmpeg-installer/ffmpeg', () => ({
    path: '/foo/bar/ffmpeg'
}))

vi.mock('@wdio/reporter', () => ({
    default: class {
        options: unknown
        write = vi.fn()
        constructor (options: unknown) {
            this.options = options
        }
    }
}))

vi.mock('@wdio/allure-reporter', () => ({
    addAttachment: vi.fn(),
    addArgument: vi.fn()
}))

vi.mock('@wdio/globals', () => ({
    browser: {
        capabilities: {
            browserName: 'chrome',
            browserVersion: '1.2.3'
        },
        acceptAlert: vi.fn().mockResolvedValue({}),
        getAlertText: vi.fn().mockResolvedValue({}),
        saveScreenshot: vi.fn().mockResolvedValue({}),
        browsingContextCaptureScreenshot: vi.fn().mockResolvedValue({}),
        getWindowHandle: vi.fn().mockResolvedValue('contextString')
    }
}))

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

const allureRunner: any = {
    isMultiRemote: false,
    sessionId: '1234',
    config: {
        outputDir: '/foo/bar'
    },
    instanceOptions: {
        1234: {
            reporters: [['allure', { outputDir: '/foo/bar' }]]
        }
    }
}

describe('Video Reporter', () => {
    const processOn = process.on.bind(process)
    beforeEach(() => {
        process.on = vi.fn()
        vi.mocked(browser.saveScreenshot).mockClear()
        vi.mocked(browser.getAlertText).mockClear()
        vi.mocked(browser.browsingContextCaptureScreenshot).mockClear()
        vi.mocked(fs.mkdirSync).mockClear()
    })
    afterEach(() => {
        process.on = processOn
    })

    it('sets screenshotIntervalSecs', () => {
        const options = { screenshotIntervalSecs: 2 }
        const reporter = new VideoReporter(options)
        expect(reporter.options.screenshotIntervalSecs).toBe(2)
    })

    it('sets screenshotIntervalSecs to max of 0.5s', () => {
        const options = { screenshotIntervalSecs: 0.1 }
        const reporter = new VideoReporter(options)
        expect(reporter.options.screenshotIntervalSecs).toBe(0.5)
    })

    describe('onRunnerStart', () => {
        it('should set allure output dir and be called one time', () => {
            const reporter = new VideoReporter({})
            reporter.onRunnerStart(allureRunner)
            expect(vi.mocked(process.on)).toBeCalledTimes(1)
        })

        it('sets outputDir to default value if not configured', () => {
            const reporter = new VideoReporter({})
            reporter.onRunnerStart({
                ...allureRunner,
                config: {}
            })
            expect(reporter.outputDir).toEqual('_results_')
        })

        it('should set record to true', () => {
            const reporter = new VideoReporter({})
            reporter.onRunnerStart(allureRunner)
            expect(reporter.record).toBe(true)
        })

        it('should set record to false when onlyRecordLastFailure is set and not last retry', () => {
            const reporter = new VideoReporter({ onlyRecordLastFailure: true })
            reporter.onRunnerStart({ ...allureRunner, retry: 1, specFileRetries: 2 })
            expect(reporter.record).toBe(false)
        })

        it('should set record to true when onlyRecordLastFailure is set and is on the last retry', () => {
            const reporter = new VideoReporter({ onlyRecordLastFailure: true })
            reporter.onRunnerStart({ ...allureRunner, retry: 2, config: { specFileRetries: 2 } })
            expect(reporter.record).toBe(true)
        })
    })

    it('onBeforeCommand', async () => {
        const addAttachmentExtensionMock = vi.spyOn(AllureReporterExtension.prototype, 'addAttachment')
        const reporter = new VideoReporter({})
        expect(reporter.allureVideos).toEqual([])

        reporter.testName = 'testName'
        reporter.onRunnerStart(allureRunner)
        reporter.onBeforeCommand()
        expect(reporter.allureVideos).not.toEqual([])
        await sleep()
        expect(addAttachmentExtensionMock).toBeCalledWith(
            'Execution video',
            expect.stringMatching(/testName.webm$/),
            'video/webm'
        )
    })

    describe('onAfterCommand', () => {
        it('should do nothing if unknown command', () => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ endpoint: '/foo/bar' } as any)
            expect(browser.getAlertText).toBeCalledTimes(0)
        })

        it('should do nothing if command is not included in snapshotCommands list', () => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ endpoint: '/session/1234/foo' } as any)
            expect(browser.getAlertText).toBeCalledTimes(0)
        })

        it('should do nothing if command is excluded', () => {
            const reporter = new VideoReporter({
                excludedActions: ['click']
            })
            reporter.recordingPath = '/foo/bar'
            expect(reporter.onAfterCommand({ endpoint: '/session/1234/click' } as any))
                .toBe(false)
        })

        it('should do nothing if recordingPath is not set', () => {
            const reporter = new VideoReporter({})
            expect(reporter.onAfterCommand({ endpoint: '/session/1234/click' } as any))
                .toBe(false)
        })

        it('should add frame if no alert is displayed', () => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ endpoint: '/session/1234/click' } as any)
            expect(browser.saveScreenshot).toBeCalledTimes(1)
        })

        it('should add frame if recordAllActions is set', () => {
            const reporter = new VideoReporter({ recordAllActions: true })
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ endpoint: '/session/1234/foobar' } as any)
            expect(browser.saveScreenshot).toBeCalledTimes(1)
        })

        it('should call addFrame', () => {
            const reporter = new VideoReporter({})
            reporter.addFrame = vi.fn() as any
            reporter.record = true
            const result = reporter.onAfterCommand({ endpoint: '/session/1234/foobar' } as any)
            expect(result).toBe(false)
        })

        it('should not call addFrame', () => {
            const reporter = new VideoReporter({})
            reporter.addFrame = vi.fn() as any
            reporter.record = false
            reporter.onAfterCommand({ endpoint: '/session/1234/foobar' } as any)
            expect(reporter.addFrame).toBeCalledTimes(0)
        })
    })

    describe('onSuiteStart', () => {
        it('should set testNameStructure for Cucumber', () => {
            const reporter = new VideoReporter({})
            reporter.onSuiteStart({ title: 'foo bar' } as any)
            expect(reporter.testNameStructure).toEqual([])

            reporter.isCucumberFramework = true
            reporter.onSuiteStart({ title: 'foo bar', type:'scenario' } as any)
            expect(reporter.testNameStructure).toEqual(['foo-bar'])
            expect(reporter.recordingPath).toEqual(expect.stringContaining(`${path.sep}foo-bar--CHROME--`))
        })

        it('should set recordingPath if suite is scenario', () => {
            const reporter = new VideoReporter({})
            reporter.onSuiteStart({ title: 'foo bar', type: 'scenario' } as any)
            expect(reporter.recordingPath).toEqual(expect.stringContaining(`${path.sep}unknown--CHROME--`))
            reporter.isCucumberFramework = true
            reporter.onSuiteStart({ title: 'foo bar', type: 'scenario' } as any)
            expect(reporter.recordingPath).toEqual(expect.stringContaining(`${path.sep}foo-bar--CHROME--`))
        })
    })

    describe('onSuiteEnd', () => {
        it('extends Allure report', async () => {
            const addArgumentExtensionMock = vi.spyOn(AllureReporterExtension.prototype, 'addArgument')
            const reporter = new VideoReporter({})
            reporter.onSuiteEnd({} as any)
            await sleep()
            expect(addArgumentExtensionMock).toBeCalledTimes(0)

            reporter.onRunnerStart(allureRunner)
            reporter.onSuiteEnd({} as any)
            await sleep()
            expect(addArgumentExtensionMock).toBeCalledTimes(1)
            expect(addArgumentExtensionMock).toBeCalledWith('browserVersion', '1.2.3')
        })

        it('should add frame if test failed', async () => {
            const reporter = new VideoReporter({})
            reporter.testName = 'foo bar'
            reporter.recordingPath = '/foo/bar'
            reporter.onRunnerStart(allureRunner)
            reporter.onSuiteEnd({ tests: [{ state: 'failed' }] } as any)
            await sleep()
            expect(browser.saveScreenshot).toBeCalledTimes(1)
            expect(fs.writeFileSync).toBeCalledTimes(0)
        })

        it('should add a blank frame if taking screenshot fails', async () => {
            vi.mocked(browser.saveScreenshot).mockRejectedValue(new Error('foobar'))
            const reporter = new VideoReporter({})
            reporter.testName = 'foo bar'
            reporter.recordingPath = '/foo/bar'
            reporter.onRunnerStart(allureRunner)
            reporter.onSuiteEnd({ tests: [{ state: 'failed' }] } as any)
            await sleep()
            expect(browser.saveScreenshot).toBeCalledTimes(1)
            expect(fs.writeFileSync).toBeCalledTimes(1)
        })

        it('should not call addFrame', () => {
            const reporter = new VideoReporter({})
            reporter.addFrame = vi.fn() as any
            reporter.testName = 'foo bar'
            reporter.record = false
            reporter.onSuiteStart({ tests: [{ state: 'failed' }] } as any)
            expect(reporter.addFrame).toBeCalledTimes(0)
        })
    })

    describe('onTestStart', () => {
        beforeAll(() => {
            vi.useFakeTimers()
        })

        afterAll(() => {
            vi.useRealTimers()
        })

        it('calls mkdirSync', () => {
            const reporter = new VideoReporter({})
            reporter.onTestStart({ title: 'foo bar' } as any)
            expect(fs.mkdirSync).toBeCalledWith(
                expect.stringContaining(`${path.sep}foo-bar--CHROME--`),
                { recursive: true }
            )
        })

        it('adds a frame on interval', () => {
            const reporter = new VideoReporter({ screenshotIntervalSecs: 1 })
            reporter.addFrame = vi.fn() as any
            reporter.onTestStart({ title: 'foo bar' } as any)
            vi.advanceTimersToNextTimer()
            expect(reporter.addFrame).toBeCalledTimes(1)
        })

        it('should not call mkdirSync', () => {
            const reporter = new VideoReporter({})
            reporter.record = false
            reporter.onTestStart({ title: 'foo bar' } as any)
            expect(fs.mkdirSync).toBeCalledTimes(0)
        })

        it('should call mkdirSync', () => {
            const reporter = new VideoReporter({})
            reporter.record = true
            reporter.onTestStart({ title: 'foo bar' } as any)
            expect(fs.mkdirSync).toBeCalledTimes(1)
        })
    })

    describe('onTestEnd', () => {
        it('should generate video', () => {
            const reporter = new VideoReporter({})
            reporter.testName = 'foo bar'
            reporter.generateVideo = vi.fn() as any
            reporter.onTestEnd({ state: 'failed' } as any)
            expect(reporter.generateVideo).toBeCalledTimes(1)
        })

        it('should not generate video when retry < specFileRetries and the test has failed', () => {
            const reporter = new VideoReporter({ onlyRecordLastFailure: true })
            reporter.testName = 'foo bar'
            reporter.onRunnerStart({ ...allureRunner, retry: 1, specFileRetries: 2 })
            reporter.generateVideo = vi.fn() as any
            reporter.onTestEnd({ state: 'failed' } as any)
            expect(reporter.generateVideo).toBeCalledTimes(0)
        })

        it('should generate video when retry equals specFileRetries and the test failed', () => {
            const reporter = new VideoReporter({ onlyRecordLastFailure: true })
            reporter.testName = 'foo bar'
            reporter.onRunnerStart({ ...allureRunner, retry: 2, config: { specFileRetries: 2 } })
            reporter.generateVideo = vi.fn() as any
            reporter.onTestEnd({ state: 'failed' } as any)
            expect(reporter.generateVideo).toBeCalledTimes(1)
        })
    })

    describe('onTestSkip', () => {
        it('clears intervalScreenshot', () => {
            const reporter = new VideoReporter({})
            reporter.intervalScreenshot = 1234 as any
            reporter.onTestSkip(({ state: 'skipped' } as any))
            expect(reporter.intervalScreenshot).toBeUndefined()
        })

        it('should call clearScreenshotInterval', () => {
            const reporter = new VideoReporter({})
            reporter.clearScreenshotInterval = vi.fn() as any
            reporter.record = true
            reporter.onTestSkip(({ state: 'skipped' } as any))
            expect(reporter.clearScreenshotInterval).toBeCalledTimes(1)
        })

        it('should not call clearScreenshotInterval', () => {
            const reporter = new VideoReporter({})
            reporter.clearScreenshotInterval = vi.fn() as any
            reporter.record = false
            reporter.onTestSkip(({ state: 'skipped' } as any))
            expect(reporter.clearScreenshotInterval).toBeCalledTimes(0)
        })
    })

    describe('addFrame', () => {
        it('should return false if no recording path is set', () => {
            const reporter = new VideoReporter({})
            const addFrameResult = reporter.addFrame()
            expect(browser.browsingContextCaptureScreenshot).not.toBeCalled()
            expect(browser.saveScreenshot).not.toBeCalled()
            expect(addFrameResult).toBeFalsy()
        })

        it('calls browsingContextCaptureScreenshot if browser is bidi', async () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame()
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(1)
            expect(browser.saveScreenshot).not.toBeCalled()
        })

        it('calls saveScreenshot if browser is not bidi', async () => {
            browser.isBidi = false
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame()
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).not.toBeCalled()
            expect(browser.saveScreenshot).toBeCalledTimes(1)
        })
    })

    describe('onTestPass', () => {
        it('should return if not recording', () => {
            const reporter = new VideoReporter({})
            reporter.record = false
            const testEndMock = vi.spyOn(reporter, 'onTestEnd')
            reporter.onTestPass({ state: 'passed' } as any)
            expect(testEndMock).not.toBeCalled()
        })

        it('should return if not cucumber', () => {
            const reporter = new VideoReporter({})
            reporter.record = true
            reporter.isCucumberFramework = false
            const testEndMock = vi.spyOn(reporter, 'onTestEnd')
            reporter.onTestPass({ state: 'passed' } as any)
            expect(testEndMock).not.toBeCalled()
        })

        it('should call onTestEnd if cucumber framework', () => {
            const reporter = new VideoReporter({})
            reporter.record = true
            reporter.isCucumberFramework = true
            const testEndMock = vi.spyOn(reporter, 'onTestEnd')
            reporter.onTestPass({ state: 'passed' } as any)
            expect(testEndMock).toBeCalledTimes(1)
        })
    })

    describe('onTestFail', () => {
        it('should return if not recording', () => {
            const reporter = new VideoReporter({})
            reporter.record = false
            const testEndMock = vi.spyOn(reporter, 'onTestEnd')
            reporter.onTestFail({ state: 'failed' } as any)
            expect(testEndMock).not.toBeCalled()
        })

        it('should return if not cucumber', () => {
            const reporter = new VideoReporter({})
            reporter.record = true
            reporter.isCucumberFramework = false
            const testEndMock = vi.spyOn(reporter, 'onTestEnd')
            reporter.onTestFail({ state: 'failed' } as any)
            expect(testEndMock).not.toBeCalled()
        })

        it('should call onTestEnd if cucumber framework', () => {
            const reporter = new VideoReporter({})
            reporter.record = true
            reporter.isCucumberFramework = true
            const testEndMock = vi.spyOn(reporter, 'onTestEnd')
            reporter.onTestFail({ state: 'failed' } as any)
            expect(testEndMock).toBeCalledTimes(1)
        })
    })

})
