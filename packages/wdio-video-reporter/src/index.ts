import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'

import logger from '@wdio/logger'
import WdioReporter, { type RunnerStats, type AfterCommandArgs, type SuiteStats, type TestStats } from '@wdio/reporter'
import { browser } from '@wdio/globals'
import type { Options } from '@wdio/types'

import AllureReporterExtension from './allure.js'
import { removeAllureAttachments } from './allureResults.js'
import {
    waitForVideosToExist, waitForVideosToBeWritten, getCurrentCapabilities, getVideoFormatSettings,
    getVideoPath, pad, generateFilename, getBidiSnapshotCommand, endsInTime, getScreenshotBrowser,
    findAllureReporter, findFfmpeg
} from './helpers.js'
import { DEFAULT_OPTIONS, STDERR_TAIL_LENGTH, SUPPORTED_VIDEO_FORMATS } from './constants.js'
import type { ReporterOptions } from './types.js'

/**
 * a BiDi command that can take a frame, and its browsing context
 */
interface BidiFrameCommand {
    name: string
    context?: string
}

import notAvailableImage from './assets/notAvailableImage.js'

const log = logger('@wdio/video-reporter')

export default class VideoReporter extends WdioReporter {
    options: Required<ReporterOptions>
    #outputDir: string = os.tmpdir()
    #isDone = false
    #usingAllure = false
    #allureOutputDir?: string
    #allureReporter = new AllureReporterExtension()
    #record = true
    #ffmpegPath?: string
    #defaultOutputDir = '_results_'

    screenshotPromises: Promise<void>[] = []
    videos: string[] = []
    videoPromises: Promise<unknown>[] = []
    processList: Set<ChildProcess> = new Set()
    frameNr = 0
    intervalScreenshot?: NodeJS.Timeout
    allureVideos: string[] = []
    recordingPath?: string
    testNameStructure: string[] = []
    testName?: string
    isCucumberFramework = false
    /**
     * Cucumber with `scenarioLevelReporter`: each scenario is reported as a test,
     * not as a suite with its steps as tests
     */
    #isScenarioLevelReporter = false
    /**
     * the title of the test that started and did not end yet
     */
    #openTestTitle?: string
    #bidiCommandsById = new Map<number, BidiFrameCommand>()
    #listensToBidiCommands = false
    /**
     * BiDi session: the window of the classic commands (it does not change, BiDi
     * sessions have no `switchWindow`), and the browsing context of the last frame
     * when it is another tab or window (for example one from `newWindow()`)
     */
    #mainContext?: string
    #frameContext?: string
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

        if (!Object.hasOwn(SUPPORTED_VIDEO_FORMATS, this.options.videoFormat)) {
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
   * Set wdio config options
   */
    onRunnerStart (runner: RunnerStats) {
        /**
         * the last attempt of a spec file: retry is specFileRetries. With no retries, the
         * only attempt is the last one, but the first attempt has retry specFileRetries + 1
         * (the launcher does not know the retries yet)
         */
        const specFileRetries = runner.config.specFileRetries ?? 0
        const isLastAttempt = specFileRetries === 0 || runner.retry === specFileRetries
        if (this.options.onlyRecordLastFailure && !isLastAttempt) {
            this.#record = false
            return
        }

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

        this.#outputDir = this.options.outputDir ?? runner.config.outputDir as string
        this.#outputDir = this.#outputDir ?? this.#defaultOutputDir
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

        this.isCucumberFramework = runnerInstance.framework === 'cucumber'
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

    onBeforeCommand () {
        if (!this.#usingAllure || !this.testName || !this.#record) {
            return
        }

        // Ensure video attachment happens regardless of disableWebdriverStepsReporting setting
        this.#attachVideoToAllure()
    }

    /**
   * Save screenshot or add not available image movie stills
   */
    onAfterCommand (commandArgs: AfterCommandArgs) {
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
        return this.#addFrameForCommand(commandName, commandArgs.endpoint)
    }

    /**
     * In a WebDriver BiDi session, some commands (for example `url` with an http URL,
     * `back`, `forward` and `execute`) use WebDriver BiDi and do not send
     * `client:afterCommand`. Take their frame when their result comes back.
     */
    listenToBidiCommands () {
        const instance = browser && getScreenshotBrowser(browser)
        if (!instance?.isBidi || this.#listensToBidiCommands || typeof instance.on !== 'function') {
            return
        }
        this.#listensToBidiCommands = true
        instance.getWindowHandle().then(
            (handle) => { this.#mainContext = handle },
            () => { /* no window: the frames use the classic screenshot */ }
        )
        /**
         * a result has the id of its command, but not its method: keep the commands
         * that take a frame by id (results can come in another order)
         */
        instance.on('bidiCommand', (command: { id?: number, method?: string, params?: unknown }) => {
            const name = getBidiSnapshotCommand(command)
            if (!name || typeof command.id !== 'number') {
                return
            }
            const params = command.params as { context?: string, target?: { context?: string } } | undefined
            this.#bidiCommandsById.set(command.id, { name, context: params?.context ?? params?.target?.context })
        })
        instance.on('bidiResult', (result: { id?: number }) => {
            const frameCommand = typeof result?.id === 'number' ? this.#bidiCommandsById.get(result.id) : undefined
            if (!frameCommand) {
                return
            }
            this.#bidiCommandsById.delete(result.id!)
            if (this.#record) {
                this.#addFrameForCommand(frameCommand.name, `WebDriver BiDi ${frameCommand.name}`, frameCommand.context)
            }
        })
    }

    /**
     * @param context  browsing context of a BiDi command, `undefined` for a classic command
     */
    #addFrameForCommand (commandName: string, label?: string, context?: string) {
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
      !this.recordingPath
        ) {
            return false
        }

        /**
         * the classic commands and the main window use the classic screenshot
         */
        this.#frameContext = context && context !== this.#mainContext ? context : undefined
        this.#log(`Add frame for command: ${label} => [${commandName}]${this.#frameContext ? ` (browsing context ${this.#frameContext})` : ''}`)
        return this.addFrame()
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

        if ((this.isCucumberFramework && suite.type === 'scenario') || this.options.filenamePrefixSource === 'suite') {
            this.testNameStructure.push(suite.title.replace(/ /g, '-').replace(/-{2,}/g, '-'))
        }

        if (suite.type === 'scenario') {
            this.#setRecordingPath()
            // Ensure video attachment happens for Allure in Cucumber scenarios too
            this.#attachVideoToAllure()
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
        this.#attachVideoToAllure(true)
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
        if (this.#isCucumberStepReporter && suite.type === 'scenario') {
            this.#extendAllureReport()
        }

        // also for a suite with no started test (for example only skipped Mocha tests)
        if (this.isCucumberFramework || this.options.filenamePrefixSource === 'suite') {
            this.testNameStructure.pop()
        }
        if (!this.testName) {
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
            this.addFrame()
            // Cucumber reports each step as a test: make one video when the scenario ends
            this.generateVideo()
        }
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

        /**
         * Mocha reports a test as started again (with a new uid) when its beforeEach
         * hook failed: keep the recording of the first start, with the frames of the hook
         */
        const startedAgain = this.#openTestTitle === suite.title
        this.#openTestTitle = suite.title
        if ((!this.isCucumberFramework || this.#isScenarioLevelReporter) && !startedAgain) {
            if (this.options.filenamePrefixSource === 'test') {
                this.testNameStructure.push(suite.title.replace(/ /g, '-').replace(/-{2,}/g, '-'))
            }
            // one recording for each test, also when the suite title gives the file name
            this.#setRecordingPath()
        }

        // Ensure video attachment happens for Allure, even when disableWebdriverStepsReporting is false
        this.#attachVideoToAllure(startedAgain)

        if (this.options.screenshotIntervalSecs && !this.intervalScreenshot) {
            const instance = this
            this.intervalScreenshot = setInterval(
                () => instance.addFrame(),
                this.options.screenshotIntervalSecs * 1000
            )
        }
    }

    /**
   * Remove empty directories
   */
    onTestSkip(payload: TestStats) {
        if (!this.#record) {
            return
        }
        if (!this.isCucumberFramework) {
            this.clearScreenshotInterval()
            return
        }
        // Only on cucumber because `onTestEnd` isn't called
        this.onTestEnd(payload)
    }

    onTestPass(payload: TestStats): void {
        if (!this.#record || !this.isCucumberFramework) {
            return
        }

        // Only on cucumber because `onTestEnd` isn't called
        this.onTestEnd(payload)
    }

    onTestFail(payload: TestStats): void {
        if (!this.#record || !this.isCucumberFramework) {
            return
        }

        // Only on cucumber because `onTestEnd` isn't called
        this.onTestEnd(payload)
    }

    /**
   * Add attachment to Allure if applicable and start to generate the video (Not applicable to Cucumber)
   */
    onTestEnd (test: TestStats) {
        if (!this.#record) {
            return
        }

        this.clearScreenshotInterval()
        this.#openTestTitle = undefined
        if (this.options.filenamePrefixSource === 'test' && (!this.isCucumberFramework || this.#isScenarioLevelReporter)) {
            this.testNameStructure.pop()
        }
        /**
         * once for each Allure test: with Cucumber step reporting, at the scenario end
         */
        if (!this.#isCucumberStepReporter) {
            this.#extendAllureReport()
        }

        if (test.state === 'failed' || (test.state === 'passed' && this.options.saveAllVideos)) {
            this.addFrame()
            if (!this.#isCucumberStepReporter) {
                this.generateVideo()
            }
        }
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
            this.processList.forEach((cp) => cp.kill())
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
        waitForVideosToBeWritten(videos, abortTime)

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

    addFrame() {
        if (!this.recordingPath) {
            return false
        }

        const frame = this.frameNr++
        const filePath = path.resolve(this.recordingPath, `${pad(frame)}.png`)

        /**
         * Use the classic WebDriver screenshot command (`takeScreenshot`), also in a
         * WebDriver BiDi session, where `saveScreenshot` uses WebDriver BiDi: the
         * testrunner ends the session before the reporters are done, and a BiDi
         * command that is still pending then never ends. Each frame also has a time
         * limit, so a lost screenshot cannot stop the video.
         */
        const instance = getScreenshotBrowser(browser)
        const context = this.#frameContext
        /**
         * a tab or window other than the main one (a BiDi browsing context): capture
         * that one (for a frame, its tab: BiDi captures top-level contexts only); the
         * main window, a closed tab or a failed capture use the classic screenshot
         */
        const capture: Promise<string> = !context
            ? instance.takeScreenshot()
            : this.#topLevelContext(instance, context).then((topLevel) => {
                if (!topLevel || topLevel === this.#mainContext) {
                    return instance.takeScreenshot()
                }
                return instance.browsingContextCaptureScreenshot({ context: topLevel, origin: 'viewport', format: { type: 'image/png' } })
                    .then((result) => result.data, (error: Error) => {
                        this.#log(`Screenshot of browsing context ${topLevel} failed (frame: ${frame}), using the main window: ${error.message}`)
                        return instance.takeScreenshot()
                    })
            })
        const screenshot = capture
            .then((data: string) => {
                fs.writeFileSync(filePath, data, 'base64')
                this.#log(`- Screenshot (frame: ${frame})`)
            })
            .catch((error: Error) => {
                fs.writeFileSync(filePath, notAvailableImage, 'base64')
                this.#log(`Screenshot not available (frame: ${frame}). Error: ${error}..`)
            })
        this.screenshotPromises.push(
            endsInTime(screenshot, this.options.videoRenderTimeout).then((inTime) => {
                if (!inTime) {
                    fs.writeFileSync(filePath, notAvailableImage, 'base64')
                    this.#log(`Screenshot not available (frame: ${frame}). Error: no answer in ${this.options.videoRenderTimeout}ms`)
                }
            })
        )
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
        if (this.intervalScreenshot) {
            clearInterval(this.intervalScreenshot)
            this.intervalScreenshot = undefined
        }
    }

    generateVideo () {
        if (!this.testName) {
            return
        }

        const formatSettings = getVideoFormatSettings(this.options.videoFormat)
        const videoPath = getVideoPath(this.#outputDir, this.testName, formatSettings.fileExtension)
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
            '-i', `${this.recordingPath}/%04d.png`,
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
        this.recordingPath = undefined

        /**
         * a failed render can leave an empty or broken file: it is not a video
         */
        const dropVideo = () => {
            fs.rmSync(videoPath, { force: true })
            this.videos = this.videos.filter((video) => video !== videoPath)
        }

        const start = Date.now()
        /**
         * each frame is written when its screenshot ends (or with the "not available"
         * image), so ffmpeg starts when all frames of the recording exist
         */
        const promise: Promise<void> = Promise
            .all(this.screenshotPromises)
            .then(() => new Promise((resolve) => {
                const cp = spawn(command, args, {
                    stdio: ['ignore', 'ignore', 'pipe'],
                    windowsHide: true,
                })
                this.processList.add(cp)
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
                    this.#log(`could not start ffmpeg ${command} for video "${videoPath}": ${err.message}`)
                    dropVideo()
                    resolve()
                })
                cp.on('close', (code: number | null) => {
                    this.processList.delete(cp)
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

    #extendAllureReport () {
        if (!this.#usingAllure) {
            return
        }
        const capabilities = getCurrentCapabilities(browser)
        const deviceName = capabilities['appium:deviceName']
        if (deviceName) {
            this.#allureReporter.addArgument('deviceName', deviceName)
        }
        if (capabilities.browserVersion) {
            this.#allureReporter.addArgument('browserVersion', capabilities.browserVersion)
        }
    }

    #setRecordingPath () {
        const fullName = this.testNameStructure.slice(1)
            .reduce((cur, acc) => cur + '--' + acc, this.testNameStructure[0] || 'unknown')

        let browserName = 'browser'
        const capabilities = getCurrentCapabilities(browser)

        const deviceName = capabilities['appium:deviceName']
        if (capabilities.browserName) {
            browserName = capabilities.browserName.toUpperCase()
        } else if (deviceName && capabilities.platformName) {
            browserName = `${deviceName.toUpperCase()}-${capabilities.platformName.toUpperCase()}`
        }

        const testName = this.testName = generateFilename(this.options.maxTestNameCharacters, browserName, fullName)
        this.frameNr = 0
        // a new recording starts with the main window, not with the tab of the last test
        this.#frameContext = undefined
        this.recordingPath = path.resolve(this.#outputDir ?? this.options.outputDir, this.options.rawPath, testName)

        fs.mkdirSync(this.recordingPath, { recursive: true })
    }

    /**
     * @param again  attach also when this video is attached already: the test that
     *               started again is another Allure test
     */
    #attachVideoToAllure (again = false) {
        if (!this.#usingAllure || !this.testName || !this.#record) {
            return
        }

        const formatSettings = getVideoFormatSettings(this.options.videoFormat)
        const videoPath = getVideoPath(this.#outputDir, this.testName, formatSettings.fileExtension)
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

