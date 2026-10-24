import fs from 'node:fs'
import path from 'node:path'

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import { browser } from '@wdio/globals'
import AllureReporterExtension from '../src/allure.js'
import VideoReporter from '../src/index.js'
import { findFfmpeg } from '../src/helpers.js'
import notAvailableImage from '../src/assets/notAvailableImage.js'

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
        browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [
            { context: 'main-tab', children: [{ context: 'main-frame', children: [] }] },
            { context: 'second-tab', children: [{ context: 'tab-frame', children: [] }] }
        ] }),
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
            reporter.onRunnerStart({ ...allureRunner, retry: 1, config: { ...allureRunner.config, specFileRetries: 2 } })
            expect(reporter.record).toBe(false)
        })

        it('records the only attempt when specFileRetries is 0 (the first attempt has retry 1)', () => {
            const reporter = new VideoReporter({ onlyRecordLastFailure: true })
            // the launcher sends retries -1 (unknown) to the first attempt: retry = specFileRetries + 1
            reporter.onRunnerStart({ ...allureRunner, retry: 1, config: { ...allureRunner.config, specFileRetries: 0 } })
            expect(reporter.record).toBe(true)
        })

        it('warns when videoRenderTimeout is larger than reporterSyncTimeout (the runner stops waiting first)', () => {
            const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.mocked(logMock.warn).mockClear()
            new VideoReporter({ videoRenderTimeout: 30000 }).onRunnerStart({ ...allureRunner, config: { ...allureRunner.config, reporterSyncTimeout: 5000 } })
            expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('reporterSyncTimeout'))
            vi.mocked(logMock.warn).mockClear()
            new VideoReporter({ videoRenderTimeout: 30000 }).onRunnerStart({ ...allureRunner, config: { ...allureRunner.config, reporterSyncTimeout: 40000 } })
            expect(logMock.warn).not.toHaveBeenCalled()
            consoleWarn.mockRestore()
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

        it.each([
            '/session/1234/url',
            '/session/1234/element/1/rect',
            '/session/1234/element/1/property/value',
            '/session/1234/element/1/selected',
            '/session/1234/element/1/enabled',
            '/session/1234/element/1/displayed'
        ])('should not add a frame for the read-only GET %s', (endpoint) => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ method: 'GET', endpoint } as any)
            expect(browser.takeScreenshot).toBeCalledTimes(0)
        })

        it('should add a frame for a command that changes the page with the same name (POST /url)', () => {
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.onAfterCommand({ method: 'POST', endpoint: '/session/1234/url' } as any)
            expect(browser.takeScreenshot).toBeCalledTimes(1)
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

    describe('Appium device name', () => {
        const chrome = browser.capabilities
        afterEach(() => {
            browser.capabilities = chrome
        })
        // an Appium session returns its capabilities without the `appium:` prefix
        const appium = { platformName: 'iOS', browserName: '', deviceName: 'iPhone 17' }

        it.each([
            ['an Appium session (no prefix)', appium, '--IPHONE17-IOS--'],
            ['the prefix', { platformName: 'Android', 'appium:deviceName': 'Pixel 7' }, '--PIXEL7-ANDROID--']
        ])('names the video with the device name of %s', (_, capabilities, name) => {
            browser.capabilities = capabilities as WebdriverIO.Capabilities
            const reporter = new VideoReporter({})
            reporter.onTestStart({ title: 'my test' } as any)
            expect(reporter.recordingPath).toEqual(expect.stringContaining(name))
        })

        it('adds the device name of an Appium session to Allure', async () => {
            browser.capabilities = appium as WebdriverIO.Capabilities
            const addArgument = vi.spyOn(AllureReporterExtension.prototype, 'addArgument').mockClear()
            const reporter = new VideoReporter({})
            reporter.onRunnerStart(allureRunner)
            reporter.testName = 'foo bar'
            reporter.onTestEnd({ state: 'passed' } as any)
            reporter.onSuiteEnd({ type: 'suite', tests: [{ state: 'passed' }] } as any)
            await sleep()
            expect(addArgument).toBeCalledWith('deviceName', 'iPhone 17')
        })
    })

    describe('Greptile review points', () => {
        it('sets a recording path for each Mocha test with filenamePrefixSource: suite', () => {
            const reporter = new VideoReporter({ filenamePrefixSource: 'suite' })
            reporter.onSuiteStart({ title: 'my suite', type: 'suite' } as any)
            reporter.onTestStart({ title: 'my test' } as any)
            expect(reporter.recordingPath).toEqual(expect.stringContaining(`${path.sep}my-suite--CHROME--`))
        })

        it('removes the name of a suite with no started test from the file names (filenamePrefixSource: suite)', () => {
            const reporter = new VideoReporter({ filenamePrefixSource: 'suite' })
            // Mocha sends no test:start for a skipped test
            reporter.onSuiteStart({ title: 'only skipped', type: 'suite' } as any)
            reporter.onSuiteEnd({ title: 'only skipped', type: 'suite', tests: [], hooks: [] } as any)
            reporter.onSuiteStart({ title: 'next suite', type: 'suite' } as any)
            reporter.onTestStart({ title: 'my test' } as any)
            expect(reporter.testNameStructure).toEqual(['next-suite'])
            expect(reporter.recordingPath).toEqual(expect.stringContaining(`${path.sep}next-suite--CHROME--`))
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
            reporter.onTestEnd({ state: 'passed' } as any)
            reporter.onTestEnd({ state: 'passed' } as any)
            reporter.onTestEnd({ state: 'passed' } as any)
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
            reporter.onTestEnd({ state: 'failed' } as any)
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

        it('attaches the video to the Allure test of each Cucumber retry (step reporting)', async () => {
            const addAttachmentMock = vi.spyOn(AllureReporterExtension.prototype, 'addAttachment').mockClear()
            const reporter = new VideoReporter({})
            reporter.onRunnerStart(allureRunner)
            reporter.isCucumberFramework = true
            reporter.onSuiteStart({ title: 'my scenario', type: 'scenario' } as any)
            expect(addAttachmentMock).toBeCalledTimes(1)
            // the Allure reporter closes the first try and opens a new Allure test
            reporter.onSuiteRetry({ title: 'my scenario', type: 'scenario' } as any)
            expect(addAttachmentMock).toBeCalledTimes(2)
            expect(addAttachmentMock.mock.calls[1]).toEqual(addAttachmentMock.mock.calls[0])
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

    describe('frames of a recording', () => {
        it('keeps no frames of a test without a video when the next test starts', () => {
            const reporter = new VideoReporter({})
            reporter.onTestStart({ uid: 'a', title: 'passes' } as any)
            reporter.addFrame()
            reporter.addFrame()
            expect(reporter.screenshotPromises).toHaveLength(2)
            reporter.onTestEnd({ uid: 'a', state: 'passed' } as any)

            reporter.onTestStart({ uid: 'b', title: 'fails' } as any)
            expect(reporter.screenshotPromises).toHaveLength(0)
        })
    })

    describe('ffmpeg', () => {
        it('sends no command and adds no hook when ffmpeg is not found', () => {
            vi.mocked(findFfmpeg).mockReturnValueOnce(undefined)
            browser.isBidi = true
            ;(browser as any).options = {}
            vi.mocked(browser.on).mockClear()
            vi.mocked(browser.getWindowHandle).mockClear()
            const reporter = new VideoReporter({})
            reporter.onRunnerStart(allureRunner)
            expect(browser.on).not.toBeCalled()
            expect(browser.getWindowHandle).not.toBeCalled()
            expect((browser as any).options.beforeCommand).toBeUndefined()
            browser.isBidi = false
            delete (browser as any).options
        })

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
            reporter.onTestEnd({ state: 'passed' } as any)
            reporter.onTestEnd({ state: 'passed' } as any)
            reporter.onTestEnd({ state: 'passed' } as any)
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
            reporter.onTestEnd({ title: 'my scenario', state: 'failed' } as any)
            expect(reporter.testNameStructure).toEqual([])
        })

        it('ends the recording of a pending Cucumber scenario (scenarioLevelReporter)', () => {
            const reporter = new VideoReporter({})
            reporter.onRunnerStart({
                ...allureRunner,
                instanceOptions: { 1234: { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter: true } } }
            })
            reporter.onTestStart({ title: 'pending scenario' } as any)
            // a step returned 'pending': the base reporter calls onTestPending, then onTestEnd at test:end
            reporter.onTestPending({ title: 'pending scenario', state: 'pending' } as any)
            reporter.onTestEnd({ title: 'pending scenario', state: 'pending' } as any)
            expect(reporter.testNameStructure).toEqual([])
            reporter.onTestStart({ title: 'next scenario' } as any)
            expect(reporter.testName).toMatch(/^next-scenario--CHROME--/)
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
            reporter.onRunnerStart({ ...allureRunner, retry: 1, config: { ...allureRunner.config, specFileRetries: 2 } })
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

    describe('session end', () => {
        it('repeats the last frame when a classic screenshot fails because deleteSession ended the session', async () => {
            vi.mocked(fs.writeFileSync).mockClear()
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            vi.mocked(browser.takeScreenshot).mockResolvedValueOnce('bGFzdA==')
            reporter.addFrame()
            let fail!: (error: Error) => void
            vi.mocked(browser.takeScreenshot).mockReturnValueOnce(new Promise((_, reject) => { fail = reject }) as any)
            reporter.addFrame()
            // geckodriver closes the connection of the screenshot in flight
            reporter.onBeforeCommand({ command: 'deleteSession', method: 'DELETE', endpoint: '/session/:sessionId', sessionId: '1234', body: {} })
            fail(new Error('WebDriverError: Request failed with error code UND_ERR_CLOSED when running "screenshot" with method "GET"'))
            await Promise.all(reporter.screenshotPromises)
            expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0001.png'), 'bGFzdA==', 'base64')
        })

        it('keeps the "not available" frame for a failed screenshot while the session runs', async () => {
            vi.mocked(fs.writeFileSync).mockClear()
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            vi.mocked(browser.takeScreenshot).mockResolvedValueOnce('bGFzdA==')
            reporter.addFrame()
            vi.mocked(browser.takeScreenshot).mockRejectedValueOnce(new Error('UND_ERR_CLOSED'))
            reporter.addFrame()
            await Promise.all(reporter.screenshotPromises)
            expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0001.png'), notAvailableImage, 'base64')
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
            const addFrame = vi.spyOn(reporter, 'addFrame')
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ id: 1, method: 'browsingContext.navigate', params: {} })
            expect(addFrame).toBeCalledTimes(0)
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            expect(addFrame).toBeCalledTimes(1)
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            expect(addFrame).toBeCalledTimes(1)
            browser.isBidi = false
        })

        it('matches each BiDi result to its command by id, also when they come out of order', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            const addFrame = vi.spyOn(reporter, 'addFrame')
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ id: 5, method: 'script.callFunction', params: {} })
            listeners.bidiCommand({ id: 6, method: 'browsingContext.navigate', params: {} })
            // the navigation answers first, the slow script after it
            listeners.bidiResult({ id: 6, type: 'success', result: {} })
            expect(addFrame).toBeCalledTimes(1)
            listeners.bidiResult({ id: 5, type: 'success', result: {} })
            expect(addFrame).toBeCalledTimes(1)
            browser.isBidi = false
        })

        it('takes the frames of a second tab from that tab, then of the main tab from the main tab', async () => {
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

            // a step in the main tab
            listeners.bidiCommand({ id: 2, method: 'browsingContext.navigate', params: { context: 'main-tab', url: 'https://y' } })
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(3)
            expect(browser.browsingContextCaptureScreenshot).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'main-tab' }))
            expect(browser.takeScreenshot).toBeCalledTimes(0)
            browser.isBidi = false
        })

        it('takes the frame of a frame (iframe) from its tab', async () => {
            browser.isBidi = true
            vi.mocked(browser.takeScreenshot).mockResolvedValue('aW1hZ2U=')
            vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
            vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValue({ data: 'dGFi' } as any)
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            await sleep(0)

            // a frame of the second tab: capture the second tab, not the frame (BiDi cannot)
            listeners.bidiCommand({ id: 1, method: 'input.performActions', params: { context: 'tab-frame', actions: [] } })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(1)
            expect(browser.browsingContextCaptureScreenshot).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'second-tab' }))

            // a frame of the main window: the main window
            listeners.bidiCommand({ id: 2, method: 'input.performActions', params: { context: 'main-frame', actions: [] } })
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(2)
            expect(browser.browsingContextCaptureScreenshot).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'main-tab' }))
            browser.isBidi = false
        })

        it('starts each test with the main window, not with the tab of the last test', async () => {
            browser.isBidi = true
            vi.mocked(browser.takeScreenshot).mockResolvedValue('aW1hZ2U=')
            vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
            vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValue({ data: 'dGFi' } as any)
            const reporter = new VideoReporter({})
            reporter.listenToBidiCommands()
            await sleep(0)
            reporter.onTestStart({ uid: '1', title: 'test 1' } as any)
            listeners.bidiCommand({ id: 1, method: 'browsingContext.navigate', params: { context: 'second-tab', url: 'https://x' } })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            reporter.onTestEnd({ uid: '1', state: 'passed' } as any)
            await sleep()
            vi.mocked(browser.takeScreenshot).mockClear()
            vi.mocked(browser.browsingContextCaptureScreenshot).mockClear()

            // test 2 sends no command that takes a frame: its end frame shows the main window
            reporter.onTestStart({ uid: '2', title: 'test 2' } as any)
            reporter.addFrame()
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(1)
            expect(browser.browsingContextCaptureScreenshot).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'main-tab' }))
            browser.isBidi = false
        })

        it('takes the main window when the tab of the frame was closed', async () => {
            browser.isBidi = true
            vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
            vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValue({ data: 'bWFpbg==' } as any)
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            await sleep(0)
            listeners.bidiCommand({ id: 1, method: 'browsingContext.reload', params: { context: 'closed-tab' } })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(1)
            expect(browser.browsingContextCaptureScreenshot).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'main-tab' }))
            expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'bWFpbg==', 'base64')
            browser.isBidi = false
        })

        it('takes the main window when the capture of a tab fails', async () => {
            browser.isBidi = true
            vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
            vi.mocked(browser.browsingContextCaptureScreenshot).mockImplementation((({ context }: { context: string }) => context === 'second-tab'
                ? Promise.reject(new Error('no such frame'))
                : Promise.resolve({ data: 'bWFpbg==' })) as any)
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            await sleep(0)
            listeners.bidiCommand({ id: 1, method: 'browsingContext.reload', params: { context: 'second-tab' } })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            await sleep()
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(2)
            expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'bWFpbg==', 'base64')
            browser.isBidi = false
        })

        it('takes no frame for other BiDi commands or excluded actions', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({ excludedActions: ['refresh'] })
            reporter.recordingPath = '/foo/bar'
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ id: 1, method: 'script.callFunction', params: {} })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            listeners.bidiCommand({ id: 2, method: 'browsingContext.reload', params: {} })
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(0)
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(0)
            browser.isBidi = false
        })

        it('takes the frame of each BiDi command when its result comes, in order', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            const addFrame = vi.spyOn(reporter, 'addFrame')
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ id: 1, method: 'browsingContext.traverseHistory', params: { delta: -1 } })
            listeners.bidiCommand({ id: 2, method: 'script.callFunction', params: {} })
            listeners.bidiCommand({ id: 3, method: 'script.callFunction', params: {} })
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            expect(addFrame).toBeCalledTimes(1)
            listeners.bidiResult({ id: 2, type: 'success', result: {} })
            listeners.bidiResult({ id: 3, type: 'success', result: {} })
            expect(addFrame).toBeCalledTimes(1)
            browser.isBidi = false
        })

        it('keeps no BiDi command when it does not record', () => {
            browser.isBidi = true
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            reporter.record = false
            reporter.listenToBidiCommands()
            listeners.bidiCommand({ id: 1, method: 'browsingContext.navigate', params: {} })
            // the command was not kept: its result takes no frame, also after a change
            reporter.record = true
            listeners.bidiResult({ id: 1, type: 'success', result: {} })
            expect(browser.takeScreenshot).toBeCalledTimes(0)
            expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(0)
            browser.isBidi = false
        })

        describe('wait for the last frame', () => {
            afterEach(() => {
                browser.isBidi = false
                delete (browser as any).options
            })
            const beforeCommandHooks = async (userHook?: Function) => {
                browser.isBidi = true
                ;(browser as any).options = userHook ? { beforeCommand: userHook } : {}
                vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
                const reporter = new VideoReporter({})
                reporter.recordingPath = '/foo/bar'
                reporter.listenToBidiCommands()
                await sleep(0)
                return { reporter, hooks: (browser as any).options.beforeCommand as Function[] }
            }

            it('makes the next command wait for the screenshot of the last frame', async () => {
                const userHook = vi.fn()
                const { reporter, hooks } = await beforeCommandHooks(userHook)
                expect(hooks).toHaveLength(2)
                expect(hooks[0]).toBe(userHook)
                let answer!: (value: unknown) => void
                vi.mocked(browser.browsingContextCaptureScreenshot).mockReturnValueOnce(new Promise((resolve) => { answer = resolve }) as any)
                reporter.addFrame()
                let started = false
                const next = Promise.resolve(hooks[1]('navigateTo')).then(() => { started = true })
                await sleep(20)
                expect(started).toBe(false)
                answer({ data: 'ZnJhbWU=' })
                await next
                expect(started).toBe(true)
                // the frame is done: the command after it does not wait
                expect(hooks[1]('elementClick')).toBeUndefined()
            })

            it('does not make its own screenshot commands wait for the frame', async () => {
                const { reporter, hooks } = await beforeCommandHooks()
                let answer!: (value: unknown) => void
                vi.mocked(browser.browsingContextCaptureScreenshot).mockReturnValueOnce(new Promise((resolve) => { answer = resolve }) as any)
                reporter.addFrame()
                for (const command of ['browsingContextCaptureScreenshot', 'takeScreenshot', 'browsingContextGetTree', 'getWindowHandle']) {
                    expect(hooks[0](command)).toBeUndefined()
                }
                // no new capture after this test
                answer({ data: 'ZnJhbWU=' })
                await Promise.all(reporter.screenshotPromises)
            })

            it('lets the next command go on when the screenshot gets no answer', async () => {
                const { reporter, hooks } = await beforeCommandHooks()
                vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
                try {
                    vi.mocked(browser.browsingContextCaptureScreenshot).mockReturnValue(new Promise(() => {}) as any)
                    reporter.addFrame()
                    let started = false
                    const next = Promise.resolve(hooks[0]('navigateTo')).then(() => { started = true })
                    await vi.advanceTimersByTimeAsync(1999)
                    expect(started).toBe(false)
                    await vi.advanceTimersByTimeAsync(1)
                    await next
                    expect(started).toBe(true)
                } finally {
                    vi.useRealTimers()
                    vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValue({} as any)
                }
            })
        })

        describe('screenshots', () => {
            const sessionEnded = () => Object.assign(new Error('the connection was closed'), { name: 'session ended' })
            const bidiReporter = async (options = {}) => {
                browser.isBidi = true
                vi.mocked(browser.getWindowHandle).mockResolvedValue('main-tab')
                const reporter = new VideoReporter(options)
                reporter.recordingPath = '/foo/bar'
                reporter.listenToBidiCommands()
                await sleep(0)
                return reporter
            }
            beforeEach(() => {
                vi.mocked(fs.writeFileSync).mockClear()
            })
            afterEach(() => {
                browser.isBidi = false
            })

            it('takes the frames of the main window with WebDriver BiDi, not with the classic screenshot', async () => {
                vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValue({ data: 'bWFpbg==' } as any)
                const reporter = await bidiReporter()
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                expect(browser.takeScreenshot).toBeCalledTimes(0)
                expect(browser.browsingContextCaptureScreenshot).toBeCalledWith(expect.objectContaining({ context: 'main-tab' }))
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'bWFpbg==', 'base64')
            })

            it('takes classic screenshots when the BiDi session has no capture command (Appium)', async () => {
                vi.mocked(browser.browsingContextCaptureScreenshot).mockRejectedValueOnce(new Error(
                    'WebDriver Bidi command "browsingContext.captureScreenshot" failed with error: unknown command - ' +
                    'The requested command is not supported'
                ))
                vi.mocked(browser.takeScreenshot).mockResolvedValue('Y2xhc3NpYw==')
                const reporter = await bidiReporter()
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'Y2xhc3NpYw==', 'base64')
                // the next frames do not try the BiDi capture again
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(1)
                expect(browser.takeScreenshot).toBeCalledTimes(2)
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0001.png'), 'Y2xhc3NpYw==', 'base64')
                vi.mocked(browser.takeScreenshot).mockResolvedValue('aW1hZ2U=')
            })

            it('uses the BiDi capture again in a new session (reloadSession)', async () => {
                vi.mocked(browser.browsingContextCaptureScreenshot).mockRejectedValueOnce(new Error(
                    'WebDriver Bidi command "browsingContext.captureScreenshot" failed with error: unknown command - x'
                ))
                const reporter = await bidiReporter()
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                expect(browser.takeScreenshot).toBeCalledTimes(1)
                const sessionId = browser.sessionId
                browser.sessionId = 'new-session'
                try {
                    vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValueOnce({ data: 'bmV3' } as any)
                    reporter.addFrame()
                    await Promise.all(reporter.screenshotPromises)
                    expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(2)
                    expect(browser.takeScreenshot).toBeCalledTimes(1)
                    expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0001.png'), 'bmV3', 'base64')
                } finally {
                    browser.sessionId = sessionId
                }
            })

            it('sends a new capture when one gets no answer in time, and the first answer wins', async () => {
                vi.mocked(browser.browsingContextCaptureScreenshot)
                    .mockReturnValueOnce(new Promise(() => {}) as any)
                    .mockResolvedValue({ data: 'c2Vjb25k' } as any)
                const reporter = await bidiReporter()
                reporter.addFrame()
                await sleep(50)
                expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(1)
                await Promise.all(reporter.screenshotPromises)
                expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(2)
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'c2Vjb25k', 'base64')
            })

            it('sends a new capture when one fails during a navigation', async () => {
                vi.mocked(browser.browsingContextCaptureScreenshot)
                    .mockRejectedValueOnce(new Error('WebDriver Bidi command "browsingContext.captureScreenshot" failed with error: no such frame - Cannot find context with specified id'))
                    .mockResolvedValue({ data: 'c2Vjb25k' } as any)
                const reporter = await bidiReporter()
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(2)
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), 'c2Vjb25k', 'base64')
            })

            it('sends 5 captures at most, and no new one after another error', async () => {
                const reporter = await bidiReporter()
                vi.mocked(browser.browsingContextCaptureScreenshot).mockRejectedValue(new Error('Cannot find context with specified id'))
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(5)

                vi.mocked(browser.browsingContextCaptureScreenshot).mockClear()
                vi.mocked(browser.browsingContextCaptureScreenshot).mockRejectedValue(new Error('unknown error'))
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                await sleep(150)
                expect(browser.browsingContextCaptureScreenshot).toBeCalledTimes(1)
                expect(fs.writeFileSync).toHaveBeenLastCalledWith(path.resolve('/foo/bar', '0001.png'), notAvailableImage, 'base64')
            })

            it('captures the main window of the new session after reloadSession()', async () => {
                vi.mocked(browser.browsingContextCaptureScreenshot).mockResolvedValue({ data: 'bWFpbg==' } as any)
                const reporter = await bidiReporter()
                vi.mocked(browser.getWindowHandle).mockResolvedValue('new-main-tab')
                browser.sessionId = 'new-session'
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                delete (browser as any).sessionId
                expect(browser.browsingContextCaptureScreenshot).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'new-main-tab' }))
            })

            it('repeats the last frame when the session ends before the screenshot', async () => {
                const reporter = await bidiReporter()
                vi.mocked(browser.browsingContextCaptureScreenshot).mockRejectedValueOnce(sessionEnded())
                reporter.addFrame()
                vi.mocked(browser.browsingContextCaptureScreenshot)
                    .mockResolvedValueOnce({ data: 'bGFzdA==' } as any)
                    .mockRejectedValue(sessionEnded())
                reporter.addFrame()
                reporter.addFrame()
                await Promise.all(reporter.screenshotPromises)
                // no frame before: the "not available" image
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0000.png'), notAvailableImage, 'base64')
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0001.png'), 'bGFzdA==', 'base64')
                expect(fs.writeFileSync).toBeCalledWith(path.resolve('/foo/bar', '0002.png'), 'bGFzdA==', 'base64')
            })
        })

        it('does not listen in a classic session', () => {
            browser.isBidi = false
            const reporter = new VideoReporter({})
            vi.mocked(browser.on).mockClear()
            reporter.listenToBidiCommands()
            expect(browser.on).not.toBeCalled()
        })
    })

    describe('multi-remote', () => {
        afterEach(() => {
            const mr = browser as any
            delete mr.isMultiRemote
            delete mr.instances
            delete mr.getInstance
        })

        it('takes a frame for the commands of the recorded instance only', () => {
            const listeners: Record<string, Record<string, (payload: unknown) => void>> = { one: {}, two: {} }
            const instance = (name: string) => ({
                on: (event: string, fn: (payload: unknown) => void) => { listeners[name][event] = fn },
                takeScreenshot: vi.fn().mockResolvedValue('aW1hZ2U=')
            })
            const instances: Record<string, ReturnType<typeof instance>> = { one: instance('one'), two: instance('two') }
            Object.assign(browser, { isMultiRemote: true, instances: ['one', 'two'], getInstance: (name: string) => instances[name] })
            const reporter = new VideoReporter({})
            reporter.recordingPath = '/foo/bar'
            const addFrame = vi.spyOn(reporter, 'addFrame').mockImplementation(() => undefined as any)
            reporter.listenToInstanceCommands()
            const click = { command: 'elementClick', method: 'POST', endpoint: '/session/:sessionId/element/1/click' }

            // the runner sends the commands of both instances, with no instance
            reporter.onAfterCommand({ ...click, sessionId: undefined } as any)
            reporter.onAfterCommand({ ...click, sessionId: undefined } as any)
            expect(addFrame).toBeCalledTimes(0)

            listeners.one.result({ ...click, result: {} })
            expect(addFrame).toBeCalledTimes(1)
            expect(listeners.two.result).toBeUndefined()
        })
    })

    describe('results of a Cucumber test', () => {
        it.each(['onTestSkip', 'onTestPending'] as const)('%s does not end a Cucumber test: every framework sends test:end after the result', (hook) => {
            const reporter = new VideoReporter({})
            reporter.record = true
            reporter.isCucumberFramework = true
            const testEndMock = vi.spyOn(reporter, 'onTestEnd')
            reporter[hook]()
            expect(testEndMock).not.toBeCalled()
        })
    })

})
