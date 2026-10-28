import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'

import logger from '@wdio/logger'
import WdioReporter, { knownFramework, type RunnerStats, type AfterCommandArgs, type BeforeCommandArgs, type ContextEnd, type SuiteStats, type TestStats } from '@wdio/reporter'
import { browser } from '@wdio/globals'
import { isSessionEndedError } from 'webdriver'
import type { Options } from '@wdio/types'

import AllureReporterExtension from './allure.js'
import { removeAllureAttachments } from './allureResults.js'
import {
    waitForVideosToExist, waitForVideosToBeWritten, getCurrentCapabilities, getDeviceName, isUnknownBidiCommand, getVideoFormatSettings,
    getVideoPath, pad, generateFilename, getBidiSnapshotCommand, endsInTime, getScreenshotBrowser,
    findAllureReporter, findFfmpeg, getNamePart
} from './helpers.js'
import {
    DEFAULT_OPTIONS, STDERR_TAIL_LENGTH, BIDI_CAPTURE_TRIES, BIDI_CAPTURE_RETRY_DELAY,
    BIDI_CAPTURE_FAILED_RETRY_DELAY, FRAME_WAIT_TIMEOUT
} from './constants.js'
import type { ReporterOptions } from './types.js'
import { Recording } from './recording.js'

/**
 * a BiDi command that can take a frame, and its browsing context
 */
interface BidiFrameCommand {
    name: string
    context?: string
    /** the recording of the test that sent the command */
    key: string
}

import notAvailableImage from './assets/notAvailableImage.js'

const log = logger('@wdio/video-reporter')

/**
 * the commands that the reporter sends to take a frame
 */
const REPORTER_COMMANDS = new Set(['takeScreenshot', 'browsingContextCaptureScreenshot', 'browsingContextGetTree', 'getWindowHandle'])

/**
 * the key of the recording outside parallel mode
 */
const MAIN = 'main'

export default class VideoReporter extends WdioReporter {
    options: Required<ReporterOptions>
    #outputDir: string = os.tmpdir()
    #isDone = false
    #usingAllure = false
    #allureOutputDir?: string
    #allureReporter = new AllureReporterExtension()
    #record = true
    #ffmpegPath?: string

    videos: string[] = []
    videoPromises: Promise<unknown>[] = []
    processList: Set<ChildProcess> = new Set()
    /** how to drop the video of each running render */
    #dropVideoOf = new Map<ChildProcess, () => void>()
    allureVideos: string[] = []
    testNameStructure: string[] = []
    isCucumberFramework = false
    /**
     * the recording of each test window in parallel mode, and of the current test
     * (key `MAIN`) outside parallel mode
     */
    #recordings = new Map<string, Recording>()
    #takenNames = new Set<string>()
    /**
     * parallel mode: the last frame of each test window, until the window closes
     */
    #lastFramesOfWindow = new Map<string, Promise<unknown>>()
    #warnedAllureParallel = false
    /**
     * a test ran in its own window: the tests of this run are parallel
     */
    #isParallelRun = false
    /**
     * Cucumber with `scenarioLevelReporter`: each scenario is reported as a test,
     * not as a suite with its steps as tests
     */
    #isScenarioLevelReporter = false
    #bidiCommandsById = new Map<number, BidiFrameCommand>()
    #listensToBidiCommands = false
    #listensToInstanceCommands = false
    /**
     * BiDi session: the window of the classic commands (it does not change, BiDi
     * sessions have no `switchWindow`; `reloadSession()` gives a new one), and the
     * browsing context of the last frame when it is another tab or window (for
     * example one from `newWindow()`)
     */
    #mainContext?: string
    #mainContextReady?: Promise<string | undefined>
    #mainContextSession?: string
    /**
     * the BiDi sessions that have no `browsingContext.captureScreenshot` (Appium): classic frames
     */
    #noBidiCaptureSessions = new Set<string | undefined>()
    /**
     * the sessions that `deleteSession` ended (also in `reloadSession()`): a classic
     * screenshot in flight then fails with a transport error (`UND_ERR_CLOSED`)
     */
    #endedSessions = new Set<string | undefined>()
    /**
     * `videoRenderTimeout` ended the report: a render that still waits for its
     * frames must not start ffmpeg after the worker went on
     */
    #renderAborted = false
    /**
     * the top-level browsing context (tab or window) of each context, for frames
     */
    #topLevelContexts = new Map<string, Promise<string | undefined>>()

    /**
   * Set reporter options
   */
    constructor (options: ReporterOptions) {
        super(options)
        this.options = Object.assign({}, DEFAULT_OPTIONS, options) as Required<ReporterOptions>

        if (this.options.screenshotIntervalSecs) {
            this.options.screenshotIntervalSecs = Math.max(this.options.screenshotIntervalSecs, 0.5)
        }

        // `default` is the fallback of the format settings, not a format that users choose
        if (!['webm', 'mp4'].includes(this.options.videoFormat)) {
            log.warn(`videoFormat "${this.options.videoFormat}" is not supported, using "${DEFAULT_OPTIONS.videoFormat}". Use "mp4" or "webm".`)
            this.options.videoFormat = DEFAULT_OPTIONS.videoFormat
        }

        this.#ffmpegPath = findFfmpeg(options.ffmpegPath)
        if (!this.#ffmpegPath) {
            this.#record = false
            const message = 'ffmpeg was not found, so no video is made. Install ffmpeg, or set the "ffmpegPath" option ' +
                'or the FFMPEG_PATH environment variable: https://webdriver.io/docs/video-reporter#install-ffmpeg'
            log.warn(message)
            /**
             * also in the terminal: with `outputDir`, WebdriverIO writes the worker log only to a file
             */
            console.warn(`[@wdio/video-reporter] ${message}`)
        }
    }

    /**
   * overwrite `isSynchronised` method
   */
    get isSynchronised () {
        return this.#isDone
    }

    /**
   * set getter to verify values for testing purposes
   */
    get outputDir () { return this.#outputDir }

    /**
   * set getter to verify values for testing purposes
   */
    get allureOutputDir () { return this.#allureOutputDir }

    /**
   * set getter to verify values for testing purposes
   */
    get record () { return this.#record }

    /**
   * set setter to verify values for testing purposes
   */
    set record (value) { this.#record = value }

    /**
     * the fields of the recording of the calling code: in parallel mode the test of
     * its browsing context, else the current test
     */
    get recordingPath () { return this.#recordingOf()?.path }
    set recordingPath (value) { this.#ownRecording().path = value }
    get testName () { return this.#recordingOf()?.testName }
    set testName (value) { this.#ownRecording().testName = value }
    get frameNr () { return this.#recordingOf()?.frameNr ?? 0 }
    set frameNr (value) { this.#ownRecording().frameNr = value }
    get screenshotPromises () { return this.#recordingOf()?.screenshots ?? [] }
    set screenshotPromises (value) { this.#ownRecording().screenshots = value }
    get intervalScreenshot () { return this.#recordingOf()?.interval }
    set intervalScreenshot (value) { this.#ownRecording().interval = value }

    /**
     * the browsing context of the parallel test that the calling code runs in
     */
    #keyOf (contextId?: string) {
        return contextId ?? this.getContextId?.() ?? MAIN
    }

    #recordingOf (contextId?: string) {
        return this.#recordings.get(this.#keyOf(contextId))
    }

    #ownRecording (contextId?: string) {
        const key = this.#keyOf(contextId)
        let recording = this.#recordings.get(key)
        if (!recording) {
            recording = new Recording(key === MAIN ? undefined : key)
            this.#recordings.set(key, recording)
            this.#isParallelRun ||= key !== MAIN
        }
        return recording
    }

    /**
     * parallel mode: a test or scenario without a window (Cucumber `failFast` skips it) is not recorded
     */
    #isSkippedParallelTest (key: string) {
        return key === MAIN && this.#isParallelRun
    }

    /**
   * Set wdio config options
   */
    onRunnerStart (runner: RunnerStats) {
        // the last attempt of a spec file; with no retries, the only attempt
        const specFileRetries = runner.config.specFileRetries ?? 0
        const isLastAttempt = specFileRetries === 0 || runner.specFileAttempt === specFileRetries
        if (this.options.onlyRecordLastFailure && !isLastAttempt) {
            this.#record = false
        }
        // also without ffmpeg: no command, no hook
        if (!this.#record) {
            return
        }

        this.listenToInstanceCommands()
        this.listenToBidiCommands()

        /**
         * the runner waits for the reporters only `reporterSyncTimeout`: when it is not
         * larger, the worker can end before the videos are rendered
         */
        const reporterSyncTimeout = runner.config.reporterSyncTimeout ?? 5000
        if (this.options.videoRenderTimeout > reporterSyncTimeout) {
            const message = `videoRenderTimeout (${this.options.videoRenderTimeout} ms) is larger than reporterSyncTimeout ` +
                `(${reporterSyncTimeout} ms): the runner can stop waiting for the videos before they are rendered. ` +
                'Set reporterSyncTimeout to a larger value in your WebdriverIO configuration.'
            log.warn(message)
            console.warn(`[@wdio/video-reporter] ${message}`)
        }

        // the option, else the WebdriverIO outputDir, else `_results_`
        this.#outputDir = this.options.outputDir ?? runner.config.outputDir ?? '_results_'
        const sessionId = runner.isMultiRemote
            ? Object.entries(runner.capabilities).map(([, caps]) => caps.sessionId)[0] as string
            : runner.sessionId

        // May not be present in the case were a spawned worker has no tests when running a subset of the test suite.
        if (!sessionId) {
            return
        }

        const runnerInstance = runner.instanceOptions[sessionId] as Options.Testrunner
        if (!runnerInstance) {
            return
        }

        this.isCucumberFramework = knownFramework(runnerInstance.framework) === 'cucumber'
        this.#isScenarioLevelReporter = this.isCucumberFramework &&
            Boolean((runnerInstance as { cucumberOpts?: { scenarioLevelReporter?: boolean } }).cucumberOpts?.scenarioLevelReporter)
        const allureOptions = findAllureReporter(runnerInstance.reporters)
        // the same folder as the Allure reporter: `outputDir`, then `resultsDir`, then `allure-results`
        const allureDir = allureOptions && (allureOptions.outputDir || allureOptions.resultsDir || 'allure-results')
        if (typeof allureDir === 'string') {
            this.#allureOutputDir = path.resolve(allureDir)
        }
        this.#usingAllure = Boolean(allureOptions)

        if (this.#usingAllure) {
            process.on('exit', () => this.onExit.call(this))
        }
    }

    onBeforeCommand (commandArgs?: BeforeCommandArgs) {
        if (commandArgs?.command === 'deleteSession' && browser) {
            this.#endedSessions.add(getScreenshotBrowser(browser).sessionId)
        }
        const contextId = commandArgs?.contextId
        if (!this.#usingAllure || !this.#recordingOf(contextId)?.testName || !this.#record) {
            return
        }

        // Ensure video attachment happens regardless of disableWebdriverStepsReporting setting
        this.#attachVideoToAllure(false, contextId)
    }

    /**
   * Save screenshot or add not available image movie stills
   */
    onAfterCommand (commandArgs: AfterCommandArgs) {
        /**
         * multi-remote: this event does not say which instance sent the command (its
         * `sessionId` is `undefined`); the frames come from the results of the recorded
         * instance (`listenToInstanceCommands`)
         */
        if (browser?.isMultiRemote) {
            return false
        }
        return this.#frameForResult(commandArgs)
    }

    /**
     * Multi-remote: the reporter records the first instance, so only the commands of
     * that instance take a frame
     */
    listenToInstanceCommands () {
        const global = browser as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser | undefined
        if (!global?.isMultiRemote || this.#listensToInstanceCommands) {
            return
        }
        const instance = getScreenshotBrowser(global)
        if (typeof instance?.on !== 'function') {
            return
        }
        this.#listensToInstanceCommands = true
        instance.on('result', (result) => this.#frameForResult(result))
    }

    #frameForResult (commandArgs: Pick<AfterCommandArgs, 'endpoint' | 'method' | 'contextId'>) {
        if (!this.#record) {
            return
        }

        const command = commandArgs.endpoint?.match(/[^/]+$/)
        const commandName = command ? command[0] : 'undefined'
        /**
         * a screenshot does not change the page, and the frames of this reporter are
         * screenshots: with `recordAllActions`, each frame would start the next one
         */
        if (commandName === 'screenshot') {
            return false
        }
        /**
         * a GET command only reads the page (for example `getUrl` or `getSize`, which
         * have the same last part as `url` and `setWindowSize`): no new frame
         */
        if (commandArgs.method === 'GET' && !this.options.recordAllActions) {
            return false
        }
        return this.#addFrameForCommand(commandName, commandArgs.endpoint, undefined, this.#keyOf(commandArgs.contextId))
    }

    /**
     * In a WebDriver BiDi session, some commands (for example `url` with an http URL,
     * `back`, `forward` and `refresh`) use WebDriver BiDi and do not send
     * `client:afterCommand`. Take their frame when their result comes back.
     */
    listenToBidiCommands () {
        const instance = browser && getScreenshotBrowser(browser)
        if (!instance?.isBidi || this.#listensToBidiCommands || typeof instance.on !== 'function') {
            return
        }
        this.#listensToBidiCommands = true
        this.#readMainContext(instance)
        this.#waitForFrameBeforeCommands(instance)
        /**
         * a result has the id of its command, but not its method: keep the commands
         * that take a frame by id (results can come in another order)
         */
        instance.on('bidiCommand', (command: { id?: number, method?: string, params?: unknown }) => {
            const name = getBidiSnapshotCommand(command)
            if (!name || typeof command.id !== 'number' || !this.#record) {
                return
            }
            const params = command.params as { context?: string, target?: { context?: string } } | undefined
            // the command is sent in the browsing context of its test, its result comes without one
            this.#bidiCommandsById.set(command.id, { name, context: params?.context ?? params?.target?.context, key: this.#keyOf() })
        })
        instance.on('bidiResult', (result: { id?: number }) => {
            const frameCommand = typeof result?.id === 'number' ? this.#bidiCommandsById.get(result.id) : undefined
            if (!frameCommand) {
                return
            }
            this.#bidiCommandsById.delete(result.id!)
            if (this.#record) {
                this.#addFrameForCommand(frameCommand.name, `WebDriver BiDi ${frameCommand.name}`, frameCommand.context, frameCommand.key)
            }
        })
    }

    /**
     * @param context  browsing context of a BiDi command, `undefined` for a classic command
     */
    #addFrameForCommand (commandName: string, label: string | undefined, context: string | undefined, key: string) {
        const recording = this.#recordings.get(key)
        /**
     * Filter out non-action commands and keep only last action command
     */
        if (
            (
                !this.options.recordAllActions &&
        (
            this.options.excludedActions.includes(commandName) ||
          !this.options.snapshotCommands.includes(commandName)
        )
            ) ||
      !recording?.path
        ) {
            return false
        }

        /**
         * the classic commands take the frame of the main window (in parallel mode: of the test window)
         */
        recording.frameContext = context && context !== this.#mainContext && context !== recording.window ? context : undefined
        this.#log(`Add frame for command: ${label} => [${commandName}]${recording.frameContext ? ` (browsing context ${recording.frameContext})` : ''}`)
        return this.addFrame(recording)
    }

    /**
   * Add suite name to naming structure
   */

    /**
   * For cucumber this hook is called twice:
   * 1. create the feature
   * 2. add the scenario to the feature
   */
    onSuiteStart (suite: SuiteStats) {
        if (!this.#record) {
            return
        }

        const key = this.#keyOf(suite.contextId)
        // parallel mode names its videos from the suite chain (`#nameParts`)
        if (key === MAIN && ((this.isCucumberFramework && suite.type === 'scenario') || this.options.filenamePrefixSource === 'suite')) {
            this.testNameStructure.push(getNamePart(suite.title))
        }

        if (suite.type === 'scenario' && !this.#isSkippedParallelTest(key)) {
            this.#setRecordingPath(key, suite)
            // Ensure video attachment happens for Allure in Cucumber scenarios too
            this.#attachVideoToAllure(false, key)
        }
    }

    /**
     * Cucumber `retry`: the scenario runs again in the same recording, and the Allure
     * reporter opens a new Allure test for this try. Attach the video to it too.
     */
    onSuiteRetry (suite: SuiteStats) {
        if (!this.#record || !this.#isCucumberStepReporter || suite.type !== 'scenario') {
            return
        }
        this.#attachVideoToAllure(true, suite.contextId)
    }

    /**
   * Clear suite name from naming structure
   */
    onSuiteEnd (suite: SuiteStats) {
        if (!this.#record) {
            return
        }

        /**
         * with Cucumber step reporting, the scenario is the Allure test
         */
        const key = this.#keyOf(suite.contextId)
        if (this.#isCucumberStepReporter && suite.type === 'scenario') {
            this.#extendAllureReport(key)
        }

        // also for a suite with no started test (for example only skipped Mocha tests)
        if (key === MAIN && (this.isCucumberFramework || this.options.filenamePrefixSource === 'suite')) {
            this.testNameStructure.pop()
        }
        const recording = this.#recordings.get(key)
        if (!recording?.testName) {
            return
        }
        /**
         * only a Cucumber scenario with step reporting has its video made here. For the
         * other suites, the video of the last test already started: a frame now would
         * not be in it, and ffmpeg could read it half written.
         */
        if (!this.#isCucumberStepReporter || suite.type !== 'scenario') {
            return
        }
        /**
         * a failed Before or After hook fails the scenario too, without a failed step
         */
        const hasFailedTests = suite.tests.some((test) => test.state === 'failed') ||
            (suite.hooks ?? []).some((hook) => hook.error)
        const allTestsPassed = !hasFailedTests

        if (hasFailedTests || (allTestsPassed && this.options.saveAllVideos)) {
            this.addFrame(recording)
            // Cucumber reports each step as a test: make one video when the scenario ends
            this.generateVideo(recording)
        }
        this.#endRecording(key)
    }

    get #isCucumberStepReporter () {
        return this.isCucumberFramework && !this.#isScenarioLevelReporter
    }

    /**
   * Setup filename based on test name and prepare storage directory
   */
    onTestStart (suite: TestStats) {
        if (!this.#record) {
            return
        }

        const key = this.#keyOf(suite.contextId)
        if (this.#isSkippedParallelTest(key)) {
            return
        }
        const recording = this.#ownRecording(key)
        /**
         * `@wdio/mocha-framework` 10.1.0 and older report a test as started again when its beforeEach hook
         * failed (mochajs/mocha#6442): keep the recording of the first start, with the frames of the hook
         */
        const startedAgain = recording.openTestTitle === suite.title
        recording.openTestTitle = suite.title
        if ((!this.isCucumberFramework || this.#isScenarioLevelReporter) && !startedAgain) {
            if (key === MAIN && this.options.filenamePrefixSource === 'test') {
                this.testNameStructure.push(getNamePart(suite.title))
            }
            // one recording for each test, also when the suite title gives the file name
            this.#setRecordingPath(key, suite)
        }

        // Ensure video attachment happens for Allure, even when disableWebdriverStepsReporting is false
        this.#attachVideoToAllure(startedAgain, key)

        if (this.options.screenshotIntervalSecs && !recording.interval) {
            recording.interval = setInterval(
                () => this.addFrame(recording),
                this.options.screenshotIntervalSecs * 1000
            )
        }
    }

    /**
     * stops the screenshots of a skipped test at once; test:end follows and makes the end frame and the video
     */
    onTestSkip() {
        if (this.#record && !this.isCucumberFramework) {
            this.clearScreenshotInterval()
        }
    }

    /**
     * a step or test that becomes pending while it runs (test:end follows, as for a skip)
     */
    onTestPending() {
        this.onTestSkip()
    }

    /**
   * Add attachment to Allure if applicable and start to generate the video (Not applicable to Cucumber)
   */
    onTestEnd (test: TestStats) {
        if (!this.#record) {
            return
        }
        const key = this.#keyOf(test.contextId)
        const recording = this.#recordings.get(key)
        this.#clearInterval(recording)
        if (recording) {
            recording.openTestTitle = undefined
        }
        if (key === MAIN && this.options.filenamePrefixSource === 'test' && (!this.isCucumberFramework || this.#isScenarioLevelReporter)) {
            this.testNameStructure.pop()
        }
        /**
         * once for each Allure test: with Cucumber step reporting, at the scenario end
         */
        if (!this.#isCucumberStepReporter) {
            this.#extendAllureReport(key)
        }

        if (test.state === 'failed' || (test.state === 'passed' && this.options.saveAllVideos)) {
            this.addFrame(recording)
            if (!this.#isCucumberStepReporter) {
                this.generateVideo(recording)
            }
        }
        if (!this.#isCucumberStepReporter) {
            this.#endRecording(key)
        }
    }

    /**
     * Mocha `retries`, Vitest `retry`, Cucumber scenario level: the failed attempt ends with test:retry and no
     * test:end, so it gets its own video. A step of a Cucumber scenario gets its test:end, and the attempts of
     * the scenario share one recording (`onSuiteRetry`)
     */
    onTestRetry (test: TestStats) {
        if (!this.#isCucumberStepReporter) {
            this.onTestEnd(test)
        }
    }

    /**
     * parallel mode: a test with no end event (a failed beforeEach with `failHookAffectedTests: false`)
     * also stops its recording when its window closes
     */
    onContextEnd ({ contextId }: ContextEnd) {
        this.#endRecording(contextId)
    }

    /**
     * parallel mode: the test window closes after the test, so its recording ends
     */
    #endRecording (key: string) {
        const recording = this.#recordings.get(key)
        if (key === MAIN || !recording) {
            return
        }
        this.#clearInterval(recording)
        this.#lastFramesOfWindow.set(key, recording.lastScreenshot)
        this.#recordings.delete(key)
    }

    /**
   * Wait for all ffmpeg-processes to finish
   */
    onRunnerEnd () {
        if (!this.#record) {
            this.#isDone = true
            return
        }

        const abortTimer = setTimeout(() => {
            this.#log('videoRenderTimeout triggered before ffmpeg had a chance to wrap up')
            this.#renderAborted = true
            /**
             * a killed render leaves a partial file, and the worker can exit before
             * the close event of ffmpeg: drop these videos now
             */
            this.processList.forEach((cp) => {
                cp.kill()
                this.#dropVideoOf.get(cp)?.()
            })
            wrapItUp()
        }, this.options.videoRenderTimeout)

        const wrapItUp = () => {
            clearTimeout(abortTimer)
            if (this.#isDone) {
                return
            }
            this.#log(`Generated ${this.videos.length} videos, video report done!`)
            this.#isDone = true
        }

        Promise.all(this.videoPromises)
            .then(wrapItUp)
            .catch((error) => {
                this.#log(`onRunnerEnd promise resolution caught ${error}\n`)
                wrapItUp()
            })
    }

    /**
   * Finalize allure report
   */
    onExit () {
        const allureOutputDir = this.#allureOutputDir
        if (!allureOutputDir) {
            return
        }
        const abortTime =  this.options.videoRenderTimeout

        const startTime = new Date().getTime()

        waitForVideosToExist(this.videos, abortTime)
        /**
         * a render that failed or was stopped by `videoRenderTimeout` has no file
         */
        const videos = this.videos.filter((video) => fs.existsSync(video))
        // one time limit for both waits
        waitForVideosToBeWritten(videos, Math.max(0, abortTime - (new Date().getTime() - startTime)))

        if (new Date().getTime() - startTime > abortTime) {
            console.log('videoRenderTimeout triggered, not all videos finished writing to disk before patching Allure')
        }

        const video = getVideoFormatSettings(this.options.videoFormat)
        // The contents of a placeholder file is the video path
        const placeholders = fs
            .readdirSync(allureOutputDir)
            .filter(line => line.endsWith(video.fileExtension))
            .flatMap((filename) => {
                const allureFile = path.resolve(allureOutputDir, filename)
                try {
                    return fs.statSync(allureFile).size < 1024
                        ? [{ allureFile, videoFilePath: fs.readFileSync(allureFile).toString() }]
                        : []
                } catch {
                    // another worker removed its placeholder after the folder was read
                    return []
                }
            })

        // Dont parse other browsers videos since they may not be ready
        placeholders
            .filter(({ videoFilePath }) => videos.includes(videoFilePath))
            .forEach(({ allureFile, videoFilePath }) => fs.copyFileSync(videoFilePath, allureFile))

        /**
         * the attachment is added when the test starts; remove it for the tests of
         * this worker that got no video (for example a passed test without
         * `saveAllVideos`, or a render that failed), else Allure shows an empty video
         */
        removeAllureAttachments(allureOutputDir, placeholders
            .filter(({ videoFilePath }) => this.allureVideos.includes(videoFilePath) && !videos.includes(videoFilePath))
            .map(({ allureFile }) => allureFile))
    }

    addFrame (recording: Recording | undefined = this.#recordingOf()) {
        if (!recording?.path) {
            return false
        }

        const frame = recording.frameNr++
        const filePath = path.resolve(recording.path, `${pad(frame)}.png`)

        /**
         * Chrome: a classic screenshot that is in flight when a WebDriver BiDi navigation
         * starts can wait 10 s, and the next classic command of the test waits with it.
         * A WebDriver BiDi session takes its frames with WebDriver BiDi. Each frame also
         * has a time limit, so a lost screenshot cannot stop the video.
         */
        const instance = getScreenshotBrowser(browser)
        const sessionId = instance.sessionId
        const previous = recording.lastScreenshot
        const capture: Promise<string> = (this.#mainContextReady && !this.#noBidiCaptureSessions.has(sessionId)
            ? this.#bidiScreenshot(instance, recording, frame).catch((error: unknown) => {
                if (!isUnknownBidiCommand(error)) {
                    throw error
                }
                this.#noBidiCaptureSessions.add(sessionId)
                this.#log(`The WebDriver BiDi session has no browsingContext.captureScreenshot, using classic screenshots (frame: ${frame})`)
                return instance.takeScreenshot()
            })
            : instance.takeScreenshot()
        ).catch((error: unknown) => {
            /**
             * the session ended first (end of the run, `reloadSession()`): show the page
             * of the last frame, not the "not available" image
             */
            if (!isSessionEndedError(error) && !this.#endedSessions.has(sessionId)) {
                throw error
            }
            return previous.then((data) => {
                if (!data) {
                    throw error
                }
                this.#log(`Session ended before the screenshot (frame: ${frame}), using the last frame`)
                return data
            })
        })
        recording.lastScreenshot = capture.catch(() => undefined)
        /**
         * after the timeout, the frame has the "not available" image and ffmpeg can read
         * it: a screenshot that ends later must not write the frame again
         */
        let timedOut = false
        const screenshot = capture
            .then((data: string) => {
                if (!timedOut) {
                    fs.writeFileSync(filePath, data, 'base64')
                    this.#log(`- Screenshot (frame: ${frame})`)
                }
            })
            .catch((error: Error) => {
                if (!timedOut) {
                    fs.writeFileSync(filePath, notAvailableImage, 'base64')
                    this.#log(`Screenshot not available (frame: ${frame}). Error: ${error}..`)
                }
            })
        recording.pendingFrame = screenshot
        recording.screenshots.push(
            endsInTime(screenshot, this.options.videoRenderTimeout).then((inTime) => {
                if (!inTime) {
                    timedOut = true
                    fs.writeFileSync(filePath, notAvailableImage, 'base64')
                    this.#log(`Screenshot not available (frame: ${frame}). Error: no answer in ${this.options.videoRenderTimeout}ms`)
                }
            })
        )
    }

    /**
     * A WebDriver BiDi capture runs beside the test. Chrome answers it when it draws the
     * next picture: when the next command started a navigation, the frame shows the next
     * page (also the first page of the next test). WebdriverIO waits for the
     * `beforeCommand` hooks, so a hook that waits for the last frame makes the next
     * command start after its screenshot.
     */
    #waitForFrameBeforeCommands (instance: WebdriverIO.Browser) {
        const options = instance.options as { beforeCommand?: Function | Function[] } | undefined
        if (!options) {
            return
        }
        const hooks = options.beforeCommand
        options.beforeCommand = [
            ...(Array.isArray(hooks) ? hooks : hooks ? [hooks] : []),
            (commandName: string, args?: unknown[]) => {
                // the commands of the screenshot itself must not wait for it
                if (REPORTER_COMMANDS.has(commandName)) {
                    return
                }
                // parallel mode: the framework closes the window of a test after its last frame
                if (commandName === 'browsingContextClose') {
                    const context = (args?.[0] as { context?: string } | undefined)?.context
                    const lastFrame = context ? this.#lastFramesOfWindow.get(context) : undefined
                    if (context && lastFrame) {
                        this.#lastFramesOfWindow.delete(context)
                        return endsInTime(lastFrame, FRAME_WAIT_TIMEOUT)
                    }
                }
                // in parallel mode only the commands of the same test wait
                const key = this.#keyOf()
                const recording = this.#recordings.get(key)
                if (!recording) {
                    // a hook after the end of a parallel test (Mocha afterEach): its last frame
                    const lastFrame = this.#lastFramesOfWindow.get(key)
                    return lastFrame && endsInTime(lastFrame, FRAME_WAIT_TIMEOUT)
                }
                const frame = recording.pendingFrame
                recording.pendingFrame = undefined
                return frame && endsInTime(frame, FRAME_WAIT_TIMEOUT)
            }
        ]
    }

    #readMainContext (instance: WebdriverIO.Browser) {
        this.#mainContextSession = instance.sessionId
        this.#mainContextReady = instance.getWindowHandle().then(
            (handle) => { this.#mainContext = handle; return handle },
            () => undefined
        )
    }

    /**
     * Capture the tab or window of the frame (for a frame (iframe), its tab: BiDi
     * captures top-level contexts only), else the main window. A closed tab or a
     * failed capture of a tab gives the main window.
     */
    async #bidiScreenshot (instance: WebdriverIO.Browser, recording: Recording, frame: number) {
        if (instance.sessionId !== this.#mainContextSession) {
            // `reloadSession()`: the main window of the new session
            this.#topLevelContexts.clear()
            this.#readMainContext(instance)
        }
        const mainWindow = await this.#mainContextReady
        if (!mainWindow) {
            // no window: only the classic screenshot can work
            return instance.takeScreenshot()
        }
        // parallel mode: the window of the test
        const main = recording.window ?? mainWindow
        const context = recording.frameContext
        const topLevel = (context && await this.#topLevelContext(instance, context)) || main
        if (topLevel === main) {
            return this.#captureContext(instance, main)
        }
        return this.#captureContext(instance, topLevel).catch((error: Error) => {
            if (isSessionEndedError(error)) {
                throw error
            }
            this.#log(`Screenshot of browsing context ${topLevel} failed (frame: ${frame}), using the main window: ${error.message}`)
            return this.#captureContext(instance, main)
        })
    }

    /**
     * Chrome: a capture during a navigation can fail ("Cannot find context") or get no
     * answer, and the next one works. Send a new capture then; the captures in flight
     * still count, the first answer wins.
     */
    #captureContext (instance: WebdriverIO.Browser, context: string) {
        return new Promise<string>((resolve, reject) => {
            let sent = 0
            let failed = 0
            let settled = false
            let timer: ReturnType<typeof setTimeout> | undefined
            const settle = (fn: () => void) => {
                settled = true
                clearTimeout(timer)
                fn()
            }
            const send = () => {
                sent++
                clearTimeout(timer)
                if (sent < BIDI_CAPTURE_TRIES) {
                    timer = setTimeout(send, BIDI_CAPTURE_RETRY_DELAY * 2 ** (sent - 1))
                }
                instance.browsingContextCaptureScreenshot({ context, origin: 'viewport', format: { type: 'image/png' } }).then(
                    ({ data }) => {
                        if (!settled) {
                            settle(() => resolve(data))
                        }
                    },
                    (error: Error) => {
                        failed++
                        if (settled) {
                            return
                        }
                        if (sent < BIDI_CAPTURE_TRIES && /Cannot find context|Not attached to an active page/.test(error.message)) {
                            clearTimeout(timer)
                            timer = setTimeout(send, BIDI_CAPTURE_FAILED_RETRY_DELAY)
                        } else if (failed === sent) {
                            settle(() => reject(error))
                        }
                    }
                )
            }
            send()
        })
    }

    /**
     * The top-level browsing context that holds `context` (itself for a tab or a
     * window), or `undefined` if no open tab or window holds it
     */
    #topLevelContext (instance: WebdriverIO.Browser, context: string) {
        let topLevel = this.#topLevelContexts.get(context)
        if (!topLevel) {
            type Tree = { context: string, children?: Tree[] | null }
            const holds = (tree: Tree): boolean => tree.context === context || (tree.children ?? []).some(holds)
            topLevel = instance.browsingContextGetTree({})
                .then(({ contexts }) => (contexts as Tree[]).find(holds)?.context, () => undefined)
            this.#topLevelContexts.set(context, topLevel)
            // an unknown context can be a tab that is still opening: ask again next time
            topLevel.then((found) => { if (!found) { this.#topLevelContexts.delete(context) } })
        }
        return topLevel
    }

    clearScreenshotInterval () {
        this.#clearInterval(this.#recordingOf())
    }

    #clearInterval (recording?: Recording) {
        if (recording?.interval) {
            clearInterval(recording.interval)
            recording.interval = undefined
        }
    }

    generateVideo (recording: Recording | undefined = this.#recordingOf()) {
        if (!recording?.testName) {
            return
        }

        const formatSettings = getVideoFormatSettings(this.options.videoFormat)
        const videoPath = getVideoPath(this.#outputDir, recording.testName, formatSettings.fileExtension)
        this.videos.push(videoPath)

        // send event to nice-html-reporter
        // @ts-expect-error
        process.emit('test:video-capture', videoPath)

        /**
         * no shell: each argument goes to ffmpeg as it is, also a path with quotes or `$`
         */
        const command = this.#ffmpegPath!
        const args = [
            '-y',
            '-r', '10',
            '-i', `${recording.path}/%04d.png`,
            '-vcodec', formatSettings.vcodec,
            '-crf', '32',
            '-pix_fmt', 'yuv420p',
            '-vf', `scale=${this.options.videoScale},setpts=${this.options.videoSlowdownMultiplier}*PTS`,
            videoPath,
        ]
        this.#log(`ffmpeg command: ${command} ${args.join(' ')}`)

        /**
         * the recording ends here: the commands after the test (for example of an
         * `afterEach` hook) would add frames while ffmpeg reads them. The next test
         * starts a new recording.
         */
        recording.path = undefined

        /**
         * a failed render can leave an empty or broken file: it is not a video
         */
        const dropVideo = () => {
            this.videos = this.videos.filter((video) => video !== videoPath)
            try {
                fs.rmSync(videoPath, { force: true })
            } catch (error: unknown) {
                // on Windows, a killed ffmpeg can still hold the file for a short time (EBUSY)
                this.#log(`Could not remove the partial video ${videoPath}: ${(error as Error).message}`)
            }
        }

        const start = Date.now()
        /**
         * each frame is written when its screenshot ends (or with the "not available"
         * image), so ffmpeg starts when all frames of the recording exist
         */
        // the frames of this recording; the next recording has its own
        const screenshots = recording.screenshots
        recording.screenshots = []
        const promise: Promise<void> = Promise
            .all(screenshots)
            .then(() => new Promise((resolve) => {
                if (this.#renderAborted) {
                    this.#log(`No video "${videoPath}": videoRenderTimeout ended before its frames`)
                    dropVideo()
                    return resolve()
                }
                const cp = spawn(command, args, {
                    stdio: ['ignore', 'ignore', 'pipe'],
                    windowsHide: true,
                })
                this.processList.add(cp)
                this.#dropVideoOf.set(cp, dropVideo)
                // keep the end of the ffmpeg output to explain a failed render
                let stderr = ''
                cp.stderr?.on('data', (data: Buffer) => {
                    stderr = (stderr + data.toString()).slice(-STDERR_TAIL_LENGTH)
                })
                /**
                 * for example an ffmpegPath that was removed after the start
                 */
                cp.on('error', (err: Error) => {
                    this.processList.delete(cp)
                    this.#dropVideoOf.delete(cp)
                    this.#log(`could not start ffmpeg ${command} for video "${videoPath}": ${err.message}`)
                    dropVideo()
                    resolve()
                })
                cp.on('close', (code: number | null) => {
                    this.processList.delete(cp)
                    this.#dropVideoOf.delete(cp)
                    if (code === 0) {
                        this.#log(`Generated video: "${videoPath}" (${Date.now() - start}ms)`)
                    } else {
                        this.#log(`ffmpeg failed with exit code ${code} for video "${videoPath}": ${stderr.trim()}`)
                        dropVideo()
                    }
                    return resolve()
                })
            }))

        this.videoPromises.push(promise)
        return promise
    }

    /**
     * the Allure reporter supports parallel mode only with Mocha: with Cucumber it would add the video
     * and the arguments to the scenario that started last, also for a failFast skip without a window
     */
    #isAllureUnsupported (key: string) {
        return this.isCucumberFramework && (key !== MAIN || this.#isParallelRun)
    }

    #extendAllureReport (key: string) {
        if (!this.#usingAllure || this.#isAllureUnsupported(key)) {
            return
        }
        const capabilities = getCurrentCapabilities(browser)
        const deviceName = getDeviceName(capabilities)
        if (deviceName) {
            this.#allureReporter.addArgument('deviceName', deviceName)
        }
        if (capabilities.browserVersion) {
            this.#allureReporter.addArgument('browserVersion', capabilities.browserVersion)
        }
    }

    /**
     * @param owner  the test (with Cucumber step reporting: the scenario) of the recording
     */
    #setRecordingPath (key: string, owner: SuiteStats | TestStats) {
        // parallel mode: tests overlap, so the name comes from the suites of the test, not from the open suites
        const nameParts = key === MAIN ? this.testNameStructure : this.#nameParts(owner)
        const fullName = nameParts.slice(1)
            .reduce((cur, acc) => cur + '--' + acc, nameParts[0] || 'unknown')

        let browserName = 'browser'
        const capabilities = getCurrentCapabilities(browser)

        const deviceName = getDeviceName(capabilities)
        if (capabilities.browserName) {
            browserName = capabilities.browserName.toUpperCase()
        } else if (deviceName && capabilities.platformName) {
            browserName = `${deviceName.toUpperCase()}-${capabilities.platformName.toUpperCase()}`
        }

        const maxLength = this.options.maxTestNameCharacters
        let testName = generateFilename(maxLength, browserName, fullName)
        // parallel tests with the same title can start in the same millisecond
        for (let n = 2; this.#takenNames.has(testName); n++) {
            testName = `${generateFilename(maxLength - `-${n}`.length, browserName, fullName)}-${n}`
        }
        this.#takenNames.add(testName)
        const recording = this.#ownRecording(key)
        recording.testName = testName
        recording.frameNr = 0
        // the frames of the last recording are not in this video (no video for a passed test without saveAllVideos)
        recording.screenshots = []
        // a new recording starts with the main window, not with the tab of the last test
        recording.frameContext = undefined
        recording.path = path.resolve(this.#outputDir, this.options.rawPath, testName)

        fs.mkdirSync(recording.path, { recursive: true })
    }

    /**
     * the same parts as `testNameStructure` in sequential mode, from the suite chain of the owner
     */
    #nameParts (owner: SuiteStats | TestStats) {
        const parts = this.options.filenamePrefixSource === 'suite' ? this.pathOf(owner).map((suite) => getNamePart(suite.title)) : []
        if (this.options.filenamePrefixSource === 'test' || owner.type === 'scenario') {
            parts.push(getNamePart(owner.title))
        }
        return parts
    }

    /**
     * @param again  attach also when this video is attached already: the test that
     *               started again is another Allure test
     */
    #attachVideoToAllure (again = false, contextId?: string) {
        const key = this.#keyOf(contextId)
        const testName = this.#recordings.get(key)?.testName
        if (!this.#usingAllure || !testName || !this.#record) {
            return
        }
        if (this.#isAllureUnsupported(key)) {
            if (!this.#warnedAllureParallel) {
                this.#warnedAllureParallel = true
                const message = '@wdio/allure-reporter does not support parallel mode with Cucumber: the videos are not attached to Allure'
                log.warn(message)
                // also in the terminal: with `outputDir`, WebdriverIO writes the worker log only to a file
                console.warn(`[@wdio/video-reporter] ${message}`)
            }
            return
        }

        const formatSettings = getVideoFormatSettings(this.options.videoFormat)
        const videoPath = getVideoPath(this.#outputDir, testName, formatSettings.fileExtension)
        if (again || !this.allureVideos.includes(videoPath)) {
            if (!this.allureVideos.includes(videoPath)) {
                this.allureVideos.push(videoPath)
            }
            this.#log(`Adding execution video attachment as ${videoPath}`)
            this.#allureReporter.addAttachment('Execution video', videoPath, formatSettings.contentType)
        }
    }

    #log (...args: string[]) {
        this.write(`[${new Date().toISOString()}] ${args.join(' ')}\n`)
    }
}

