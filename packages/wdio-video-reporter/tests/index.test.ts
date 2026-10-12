import fs from 'node:fs'
import path from 'node:path'

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import { browser } from '@wdio/globals'
import AllureReporterExtension from '../src/allure.js'
import VideoReporter from '../src/index.js'
import { findFfmpeg } from '../src/helpers.js'

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

const logMock = vi.hoisted(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }))
vi.mock('@wdio/logger', () => ({ default: () => logMock }))

vi.mock('../src/helpers.js', async (importOriginal) => ({
    ...await importOriginal<typeof HelpersModule>(),
    findFfmpeg: vi.fn(() => '/foo/bar/ffmpeg')
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
        takeScreenshot: vi.fn().mockResolvedValue('aW1hZ2U='),
        browsingContextCaptureScreenshot: vi.fn().mockResolvedValue({}),
        getWindowHandle: vi.fn().mockResolvedValue('contextString'),
        on: vi.fn()
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
        vi.mocked(browser.takeScreenshot).mockClear()
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
            expect(browser.takeScreenshot).toBeCalledTimes(1)
        })

        it.each([
            '/session/1234/window/rect',
            '/session/1234/window/minimize',
            '/session/1234/alert/accept',
            '/session/1234/alert/dismiss',
            '/session/1234/actions',
            '/session/1234/execute/sync'
        ])('should add a frame by default for the W3C endpoint %s', (endpoint) => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ endpoint } as any)
            expect(browser.takeScreenshot).toBeCalledTimes(1)
        })

        it.each([
            '/session/1234/moveto',
            '/session/1234/buttondown',
            '/session/1234/window/1/size',
            '/session/1234/accept_alert',
            '/session/1234/element/1/text'
        ])('should not add a frame by default for %s', (endpoint) => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ endpoint } as any)
            expect(browser.takeScreenshot).toBeCalledTimes(0)
        })

        it('should add frame if recordAllActions is set', () => {
            const reporter = new VideoReporter({ recordAllActions: true })
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ endpoint: '/session/1234/foobar' } as any)
            expect(browser.takeScreenshot).toBeCalledTimes(1)
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

    describe('Greptile review points', () => {
        it('sets a recording path for each Mocha test with filenamePrefixSource: suite', () => {
            const reporter = new VideoReporter({ filenamePrefixSource: 'suite' })
            reporter.onSuiteStart({ title: 'my suite', type: 'suite' } as any)
            reporter.onTestStart({ title: 'my test' } as any)
            expect(reporter.recordingPath).toEqual(expect.stringContaining(`${path.sep}my-suite--CHROME--`))
        })

        it('uses the same Allure folder as the Allure reporter', () => {
            const runnerWith = (options?: object) => ({
                ...allureRunner,
                instanceOptions: { 1234: { reporters: [options ? ['allure', options] : 'allure'] } }
            })
            const withDefault = new VideoReporter({})
            withDefault.onRunnerStart(runnerWith())
            expect(withDefault.allureOutputDir).toBe(path.resolve('allure-results'))

            const withResultsDir = new VideoReporter({})
            withResultsDir.onRunnerStart(runnerWith({ resultsDir: '/results' }))
            expect(withResultsDir.allureOutputDir).toBe(path.resolve('/results'))
        })

        it('makes one video for each Cucumber scenario, not one for each step', () => {
            const reporter = new VideoReporter({ saveAllVideos: true })
            reporter.isCucumberFramework = true
            reporter.addFrame = vi.fn() as any
            reporter.generateVideo = vi.fn() as any
            reporter.onSuiteStart({ title: 'my scenario', type: 'scenario' } as any)
            reporter.onTestPass({ state: 'passed' } as any)
            reporter.onTestPass({ state: 'passed' } as any)
            reporter.onTestPass({ state: 'passed' } as any)
            expect(reporter.generateVideo).toBeCalledTimes(0)

            reporter.onSuiteEnd({ type: 'scenario', tests: [{ state: 'passed' }, { state: 'passed' }, { state: 'passed' }] } as any)
            expect(reporter.generateVideo).toBeCalledTimes(1)
        })

        it('makes the video of a failed Cucumber scenario when the scenario ends', () => {
            const reporter = new VideoReporter({})
            reporter.isCucumberFramework = true
            reporter.addFrame = vi.fn() as any
            reporter.generateVideo = vi.fn() as any
            reporter.onSuiteStart({ title: 'my scenario', type: 'scenario' } as any)
            reporter.onTestFail({ state: 'failed' } as any)
            reporter.onTestSkip({ state: 'skipped' } as any)
            expect(reporter.generateVideo).toBeCalledTimes(0)

            reporter.onSuiteEnd({ type: 'scenario', tests: [{ state: 'failed' }, { state: 'skipped' }] } as any)
            expect(reporter.generateVideo).toBeCalledTimes(1)
        })
    })

    describe('own screenshots', () => {
        it('takes no frame for the result of a screenshot command, also with recordAllActions', () => {
            const reporter = new VideoReporter({ recordAllActions: true })
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame = vi.fn() as any
            reporter.onAfterCommand({ endpoint: '/session/1234/screenshot' } as any)
            reporter.onAfterCommand({ endpoint: '/session/1234/element/5678/screenshot' } as any)
            expect(reporter.addFrame).toBeCalledTimes(0)
            reporter.onAfterCommand({ endpoint: '/session/1234/url' } as any)
            expect(reporter.addFrame).toBeCalledTimes(1)
        })
    })

    describe('hook failures', () => {
        it('makes the video of a Cucumber scenario whose Before hook failed', () => {
            const reporter = new VideoReporter({})
            reporter.isCucumberFramework = true
            reporter.testName = 'foo bar'
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame = vi.fn() as any
            reporter.generateVideo = vi.fn() as any
            reporter.onSuiteEnd({
                type: 'scenario',
                tests: [{ state: 'skipped' }],
                hooks: [{ title: 'Before', error: new Error('hook failed') }]
            } as any)
            expect(reporter.generateVideo).toBeCalledTimes(1)
        })

        it('keeps one recording when Mocha reports a test as started again after its beforeEach hook failed', () => {
            vi.useFakeTimers()
            try {
                const reporter = new VideoReporter({ screenshotIntervalSecs: 1 })
                reporter.addFrame = vi.fn() as any
                reporter.generateVideo = vi.fn() as any
                reporter.onTestStart({ uid: 'test-00-0', title: 'test after a failing hook' } as any)
                const firstPath = reporter.recordingPath
                reporter.onTestStart({ uid: 'test-00-1', title: 'test after a failing hook' } as any)
                expect(reporter.recordingPath).toBe(firstPath)
                expect(reporter.testNameStructure).toEqual(['test-after-a-failing-hook'])

                reporter.onTestEnd({ uid: 'test-00-1', state: 'failed' } as any)
                expect(reporter.testNameStructure).toEqual([])
                expect(vi.getTimerCount()).toBe(0)
            } finally {
                vi.useRealTimers()
            }
        })
    })

    describe('ffmpeg', () => {
        it('records with the ffmpeg of the user', () => {
            const reporter = new VideoReporter({ ffmpegPath: '/my/ffmpeg' })
            expect(findFfmpeg).toHaveBeenLastCalledWith('/my/ffmpeg')
            expect(reporter.record).toBe(true)
        })

        it('makes no video and tells how to install ffmpeg when it is not found', () => {
            vi.mocked(findFfmpeg).mockReturnValueOnce(undefined)
            const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const reporter = new VideoReporter({})
            expect(reporter.record).toBe(false)
            // the terminal too: with `outputDir`, WebdriverIO writes the worker log only to a file
            expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('ffmpeg was not found'))
            consoleWarn.mockRestore()
            expect(logMock.warn).toHaveBeenCalledWith(expect.stringContaining('ffmpeg was not found'))
            expect(logMock.warn).toHaveBeenCalledWith(expect.stringContaining('https://webdriver.io/docs/video-reporter#install-ffmpeg'))
        })
    })

    describe('onSuiteEnd', () => {
        it('adds the Allure arguments once for each test (Mocha, Jasmine)', async () => {
            const addArgumentExtensionMock = vi.spyOn(AllureReporterExtension.prototype, 'addArgument').mockClear()
            const reporter = new VideoReporter({})
            reporter.onTestEnd({ state: 'passed' } as any)
            await sleep()
            expect(addArgumentExtensionMock).toBeCalledTimes(0)

            reporter.onRunnerStart(allureRunner)
            reporter.testName = 'foo bar'
            reporter.onTestEnd({ state: 'passed' } as any)
            reporter.onSuiteEnd({ type: 'suite', tests: [{ state: 'passed' }] } as any)
            await sleep()
            expect(addArgumentExtensionMock).toBeCalledTimes(1)
            expect(addArgumentExtensionMock).toBeCalledWith('browserVersion', '1.2.3')
        })

        it('adds the Allure arguments once for each Cucumber scenario, not for each step', async () => {
            const addArgumentExtensionMock = vi.spyOn(AllureReporterExtension.prototype, 'addArgument').mockClear()
            const reporter = new VideoReporter({})
            reporter.onRunnerStart(allureRunner)
            reporter.isCucumberFramework = true
            reporter.testName = 'foo bar'
            reporter.generateVideo = vi.fn() as any
            reporter.onTestPass({ state: 'passed' } as any)
            reporter.onTestPass({ state: 'passed' } as any)
            reporter.onTestPass({ state: 'passed' } as any)
            reporter.onSuiteEnd({ type: 'scenario', tests: [{ state: 'passed' }] } as any)
            await sleep()
            expect(addArgumentExtensionMock).toBeCalledTimes(1)
        })

        it('should add frame if a step of the Cucumber scenario failed', async () => {
            const reporter = new VideoReporter({})
            reporter.testName = 'foo bar'
            reporter.recordingPath = '/foo/bar'
            reporter.onRunnerStart(allureRunner)
            reporter.isCucumberFramework = true
            reporter.generateVideo = vi.fn() as any
            reporter.onSuiteEnd({ type: 'scenario', tests: [{ state: 'failed' }] } as any)
            await sleep()
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            expect(fs.writeFileSync).toBeCalledTimes(1)
            expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'aW1hZ2U=', 'base64')
        })

        it('should add a blank frame if taking screenshot fails', async () => {
            vi.mocked(browser.takeScreenshot).mockRejectedValue(new Error('foobar'))
            const reporter = new VideoReporter({})
            reporter.testName = 'foo bar'
            reporter.recordingPath = '/foo/bar'
            reporter.onRunnerStart(allureRunner)
            reporter.isCucumberFramework = true
            reporter.generateVideo = vi.fn() as any
            reporter.onSuiteEnd({ type: 'scenario', tests: [{ state: 'failed' }] } as any)
            await sleep()
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            expect(fs.writeFileSync).toBeCalledTimes(1)
        })

        it('takes no frame at the end of a Mocha or Jasmine suite, or of a Cucumber feature', () => {
            const reporter = new VideoReporter({ saveAllVideos: true })
            reporter.testName = 'foo bar'
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame = vi.fn() as any
            // the video of the last test already started: a frame now is not in it
            reporter.onSuiteEnd({ type: 'suite', tests: [{ state: 'failed' }] } as any)
            reporter.isCucumberFramework = true
            reporter.onSuiteEnd({ type: 'feature', tests: [] } as any)
            expect(reporter.addFrame).toBeCalledTimes(0)
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

        it('sets the recording path for a Cucumber scenario reported as a test (scenarioLevelReporter)', () => {
            const reporter = new VideoReporter({})
            reporter.onRunnerStart({
                ...allureRunner,
                instanceOptions: { 1234: { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter: true } } }
            })
            expect(reporter.isCucumberFramework).toBe(true)
            reporter.onTestStart({ title: 'my scenario' } as any)
            expect(fs.mkdirSync).toBeCalledWith(
                expect.stringContaining(`${path.sep}my-scenario--CHROME--`),
                { recursive: true }
            )
            reporter.onTestFail({ title: 'my scenario', state: 'failed' } as any)
            expect(reporter.testNameStructure).toEqual([])
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
            expect(browser.takeScreenshot).not.toBeCalled()
            expect(addFrameResult).toBeFalsy()
        })

        it('calls takeScreenshot also if browser is bidi', async () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame()
            await sleep()
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            expect(browser.browsingContextCaptureScreenshot).not.toBeCalled()
            browser.isBidi = false
        })

        it('adds the screenshot promise at once', () => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame()
            expect(reporter.screenshotPromises).toHaveLength(1)
        })

        it('writes the not-available frame if a screenshot does not end in time', async () => {
            vi.mocked(browser.takeScreenshot).mockReturnValueOnce(new Promise(() => {}) as any)
            const reporter = new VideoReporter({ videoRenderTimeout: 50 })
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame()
            await Promise.all(reporter.screenshotPromises)
            expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), expect.any(String), 'base64')
        })

        it('calls takeScreenshot if browser is not bidi', async () => {
            browser.isBidi = false
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.addFrame()
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).not.toBeCalled()
            expect(browser.takeScreenshot).toBeCalledTimes(1)
        })
    })

    describe('BiDi commands', () => {
        const listeners: Record<string, (payload: unknown) => void> = {}
        beforeEach(() => {
            vi.mocked(browser.on).mockImplementation(((event: string, fn: (payload: unknown) => void) => {
                listeners[event] = fn
            }) as any)
        })

        it('takes a frame after the result of a BiDi command that changes the page', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ method: 'browsingContext.navigate', params: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(0)
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            browser.isBidi = false
        })

        it('matches each BiDi result to its command by id, also when they come out of order', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ id: 5, method: 'script.callFunction', params: {} })
            listeners.bidiCommand({ id: 6, method: 'browsingContext.navigate', params: {} })
            // the navigation answers first, the slow script after it
            listeners.bidiResult({ id: 6, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            listeners.bidiResult({ id: 5, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            browser.isBidi = false
        })

        it('takes the frames of a second tab from that tab, and the main tab with the classic screenshot', async () => {
            browser.isBidi = true
            vi.mocked(browser.takeScreenshot).mockResolvedValue('aW1hZ2U=')
            vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
            vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValue({ data: 'dGFi' } as any)
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            await sleep(0)

            // a step in the second tab: its frame comes from that tab
            listeners.bidiCommand({ id: 1, method: 'browsingContext.navigate', params: { context: 'second-tab', url: 'https://x' } })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            // a frame without a command (test end) stays on the last tab
            reporter.addFrame()
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(2)
            expect(browser.browsingContextCaptureScreenshot).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'second-tab' }))
            expect(browser.takeScreenshot).toBeCalledTimes(0)

            // a step in the main tab: classic screenshot again
            listeners.bidiCommand({ id: 2, method: 'browsingContext.navigate', params: { context: 'main-tab', url: 'https://y' } })
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            await sleep()
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(2)
            browser.isBidi = false
        })

        it('takes the classic screenshot when the tab of the frame was closed', async () => {
            browser.isBidi = true
            vi.mocked(browser.takeScreenshot).mockResolvedValue('aW1hZ2U=')
            vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
            vi.mocked(browser.browsingContextCaptureScreenshot).mockRejectedValue(new Error('no such frame'))
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            await sleep(0)
            listeners.bidiCommand({ id: 1, method: 'browsingContext.reload', params: { context: 'closed-tab' } })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            await sleep()
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'aW1hZ2U=', 'base64')
            browser.isBidi = false
        })

        it('takes no frame for other BiDi commands or excluded actions', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({ excludedActions: ['refresh'] })
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ method: 'script.callFunction', params: {} })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            listeners.bidiCommand({ method: 'browsingContext.reload', params: {} })
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(0)
            browser.isBidi = false
        })

        it('takes the frame of each BiDi command when its result comes, in order', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ method: 'browsingContext.traverseHistory', params: { delta: -1 } })
            listeners.bidiCommand({ method: 'script.callFunction', params: {} })
            listeners.bidiCommand({ method: 'script.callFunction', params: {} })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            listeners.bidiResult({ id: 3, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(1)
            browser.isBidi = false
        })

        it('does not listen in a classic session', () => {
            browser.isBidi = false
            const reporter = new VideoReporter({})
            vi.mocked(browser.on).mockClear()
            reporter.listenToBidiCommands()
            expect(browser.on).not.toBeCalled()
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
