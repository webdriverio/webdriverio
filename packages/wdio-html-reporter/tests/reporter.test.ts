import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { TestStats } from '@wdio/reporter'

import { HtmlReporter, ReportAggregator, ReportEvents } from '../src/index.js'
import { makeReport } from '../src/makeReportCli.js'
import { RUNNER, SUITES } from './testdata.js'

/**
 * A relative `outputDir` is relative to the current folder: Vitest runs from the
 * repository root.
 */
const outputRoot = path.join('packages', 'wdio-html-reporter', 'tests', '.reports')
const outputDir = path.join(outputRoot, 'valid') + path.sep
const emptyOutputDir = path.join(outputRoot, 'empty') + path.sep

const eventsOf = (test: TestStats) => (test as TestStats & { events: { type: string, value: unknown }[] }).events

describe('HtmlReporter', () => {
    let htmlReporter: HtmlReporter

    beforeAll(() => {
        fs.rmSync(outputRoot, { recursive: true, force: true })
        fs.mkdirSync(outputRoot, { recursive: true })
        htmlReporter = new HtmlReporter({
            logFile: path.join(outputRoot, 'reporter.log'),
            outputDir,
            filename: 'report.html',
            reportTitle: 'Unit Test Report Title',
            browserName: 'dummy'
        } as never)
    })

    // a WebDriver BiDi override (the v10 default for Chrome and Firefox) sends no endpoint
    it('finds a screenshot command by its endpoint or by its command name', () => {
        const isShot = (command: object) => Boolean(htmlReporter.isScreenshotCommand(command as never))
        expect(isShot({ endpoint: '/session/id/element/id/screenshot' })).toBe(true)
        expect(isShot({ command: 'takeScreenshot' })).toBe(true)
        expect(isShot({ command: 'takeElementScreenshot' })).toBe(true)
        expect(isShot({ command: 'elementClick', endpoint: '/session/id/element/id/click' })).toBe(false)
    })

    // the result event of the WebDriver BiDi override: no endpoint, the base64 image in `result.value`
    it('writes a WebDriver BiDi element screenshot to the current test', () => {
        const reporter = new HtmlReporter({
            logFile: path.join(outputRoot, 'bidi-shot.log'),
            outputDir: path.join(outputRoot, 'bidi-shot') + path.sep,
            filename: 'report.html',
            useOnAfterCommandForScreenshot: true
        } as never)
        const test = { ...SUITES[0].tests[0], uid: 'bidi-shot-test' } as TestStats
        reporter.onRunnerStart(RUNNER)
        reporter.onTestStart(test)
        reporter.onAfterCommand({ command: 'takeElementScreenshot', result: { value: Buffer.from('png').toString('base64') } } as never)
        const shots = eventsOf(test).filter((event) => event.type === 'screenshot')
        expect(shots).toHaveLength(1)
        expect(fs.readFileSync(shots[0].value as string, 'utf8')).toBe('png')
    })

    afterAll(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        fs.rmSync(outputRoot, { recursive: true, force: true })
    })

    it('has the initial properties', () => {
        expect(htmlReporter._suiteUids.size).toBe(0)
        expect(htmlReporter.metrics).toEqual({ passed: 0, skipped: 0, failed: 0, duration: 0 })
    })

    it('sets the cid on runner start', () => {
        htmlReporter.onRunnerStart(RUNNER)
        expect(htmlReporter._currentCid).toBe(RUNNER.cid)
    })

    it('adds the suite on suite start', () => {
        htmlReporter.onSuiteStart(SUITES[0])
        expect(htmlReporter._suiteUids.size).toBe(1)
    })

    it('counts passed, failed and skipped tests', () => {
        const [passed, failed, skipped] = SUITES[0].tests
        htmlReporter.onTestStart(passed)
        htmlReporter.onTestPass(passed)
        htmlReporter.onTestEnd(passed)
        htmlReporter.onTestStart(failed)
        htmlReporter.onTestFail(failed)
        htmlReporter.onTestEnd(failed)
        htmlReporter.onTestStart(skipped)
        htmlReporter.onTestSkip(skipped)
        htmlReporter.onTestEnd(skipped)
        expect(htmlReporter.metrics).toMatchObject({ passed: 1, failed: 1, skipped: 1 })
    })

    it('adds logs, screenshots and videos sent with ReportEvents to the current test', () => {
        const test = SUITES[0].tests[2]
        new ReportEvents()
            .logMessage('a log line')
            .logScreenshot('shot.png')
            .videoCapture('video.webm')
        expect(eventsOf(test).map((event) => [event.type, event.value])).toEqual([
            ['log', 'a log line'],
            ['screenshot', 'shot.png'],
            ['video-capture', 'video.webm']
        ])
    })

    it('adds logs, screenshots and videos that the Vitest framework replays on the reporter to the current test', () => {
        const test = SUITES[0].tests[2]
        htmlReporter.emit('test:log', { value: 'a replayed log' })
        htmlReporter.emit('test:screenshot', { value: 'replayed.png' })
        htmlReporter.emit('test:video-capture', { value: 'replayed.webm' })
        expect(eventsOf(test).slice(-3).map((event) => [event.type, event.value])).toEqual([
            ['log', 'a replayed log'],
            ['screenshot', 'replayed.png'],
            ['video-capture', 'replayed.webm']
        ])
    })

    it('removes the replay listeners on runner end, together with the process ones', async () => {
        const reporter = new HtmlReporter({
            logFile: path.join(outputRoot, 'replay-listeners.log'),
            outputDir: path.join(outputRoot, 'replay-listeners') + path.sep,
            filename: 'report.html'
        } as never)
        const events = ['test:log', 'test:screenshot', 'test:video-capture']
        const counts = () => events.map((event) => [reporter.listenerCount(event), process.listenerCount(event)])
        const before = counts()
        reporter.onRunnerStart(RUNNER)
        await reporter.onRunnerEnd(RUNNER)
        expect(before.every(([own, onProcess]) => own === 1 && onProcess > 0)).toBe(true)
        expect(counts().map(([own]) => own)).toEqual([0, 0, 0])
        expect(counts().map(([, onProcess]) => onProcess)).toEqual(before.map(([, onProcess]) => onProcess - 1))
    })

    it('keeps a log value that is not a string as readable text (#105)', () => {
        const test = SUITES[0].tests[2]
        new ReportEvents().logMessage({ foobar: 'object', count: NaN } as never)
        const event = eventsOf(test).at(-1)!
        expect(event.type).toBe('log')
        expect(event.value).toBe("{ foobar: 'object', count: NaN }")
    })

    it('keeps the suite on suite end', () => {
        htmlReporter.onSuiteEnd(SUITES[0])
        expect(htmlReporter._suiteUids.size).toBe(1)
    })

    it('writes the JSON of the worker on runner end, and the aggregator creates the HTML report', async () => {
        await htmlReporter.onRunnerEnd(RUNNER)
        const reportAggregator = new ReportAggregator({
            outputDir,
            filename: 'master-report.html',
            reportTitle: 'Master Report',
            browserName: 'test browser',
            produceJson: true
        } as never)
        expect(reportAggregator.readJsonFiles()).toHaveLength(1)

        await reportAggregator.createReport()

        expect(reportAggregator.reportFile).toBe(path.join(process.cwd(), outputDir, 'master-report.html'))
        const html = fs.readFileSync(reportAggregator.reportFile, 'utf-8')
        expect(html).toContain('Master Report')
        expect(html).toContain('Foo test')
        expect(fs.existsSync(path.join(outputDir, 'report-styles.css'))).toBe(true)
    })

    it('creates a report when no worker wrote a JSON file', async () => {
        fs.mkdirSync(emptyOutputDir, { recursive: true })
        const reportAggregator = new ReportAggregator({
            outputDir: emptyOutputDir,
            filename: 'master-report.html',
            reportTitle: 'Empty Report',
            browserName: 'test browser'
        } as never)

        await reportAggregator.createReport()

        expect(fs.readFileSync(reportAggregator.reportFile, 'utf-8')).toContain('Empty Report')
    })
})

describe('HtmlReporter with Cucumber', () => {
    const cucumberOutputDir = path.join(outputRoot, 'cucumber') + path.sep
    const runner = { cid: '0-0', config: { framework: 'cucumber' } } as never
    const scenario = (state: 'passed' | 'failed' | 'skipped' | 'pending') => ({
        uid: 'scenario-1',
        type: 'scenario',
        tests: [{ state: 'passed' }, { state }],
        hooks: []
    }) as never

    afterAll(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        fs.rmSync(outputRoot, { recursive: true, force: true })
    })

    it('counts a scenario with a skipped or pending step as skipped, not passed', () => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: cucumberOutputDir } as never)
        reporter.onRunnerStart(runner)
        reporter.onSuiteEnd({ ...scenario('skipped'), uid: 'scenario-skipped' } as never)
        reporter.onSuiteEnd({ ...scenario('pending'), uid: 'scenario-pending' } as never)
        reporter.onSuiteEnd({ ...scenario('passed'), uid: 'scenario-passed' } as never)
        expect(reporter.metrics).toMatchObject({ passed: 1, failed: 0, skipped: 2 })
    })

    // the name in any case and the scoped package, as initializePlugin loads them
    it.each(['Cucumber', '@wdio/cucumber-framework'])('counts scenarios, not steps, for framework %s', (framework) => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: cucumberOutputDir } as never)
        reporter.onRunnerStart({ cid: '0-0', config: { framework } } as never)
        // 2 passed steps of 1 scenario: 1 passed scenario
        reporter.onTestPass({ uid: 'step-1', state: 'passed' } as never)
        reporter.onTestPass({ uid: 'step-2', state: 'passed' } as never)
        reporter.onSuiteEnd({ ...scenario('passed'), uid: 'scenario-passed' } as never)
        expect(reporter.metrics).toMatchObject({ passed: 1, failed: 0, skipped: 0 })
    })

    it('counts the steps as tests with scenarioLevelReporter', () => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: cucumberOutputDir } as never)
        reporter.onRunnerStart({ cid: '0-0', config: { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter: true } } } as never)
        reporter.onTestPass({ uid: 'scenario-as-test', state: 'passed' } as never)
        expect(reporter.metrics).toMatchObject({ passed: 1, failed: 0 })
    })
})

describe('links in log messages', () => {
    const linksOutputDir = path.join(outputRoot, 'links') + path.sep
    const message = "see https://webdriver.io/docs?a=1&b=2 and <b>bold</b> and https://example.com/O'Reilly" +
        ' Opened https://example.com/page. (see https://example.com/a) and https://en.wikipedia.org/wiki/Foo_(bar), done'

    beforeAll(async () => {
        fs.mkdirSync(linksOutputDir, { recursive: true })
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: linksOutputDir, filename: 'report.html', reportTitle: 'Links' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        new ReportEvents().logMessage(message)
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
    })

    afterAll(() => {
        process.removeAllListeners('test:log')
        fs.rmSync(outputRoot, { recursive: true, force: true })
    })

    const createReport = async (linkUrls?: boolean) => {
        const reportAggregator = new ReportAggregator({
            outputDir: linksOutputDir,
            filename: `master-${linkUrls}.html`,
            reportTitle: 'Links',
            browserName: 'chrome',
            ...(linkUrls === undefined ? {} : { linkUrls })
        } as never)
        await reportAggregator.createReport()
        return fs.readFileSync(reportAggregator.reportFile, 'utf-8')
    }

    it('escapes the log text and makes no links by default', async () => {
        const html = await createReport()
        expect(html).toContain('see https://webdriver.io/docs?a=1&amp;b=2 and &lt;b&gt;bold&lt;/b&gt;')
        expect(html).not.toContain('<a href="https://webdriver.io/docs')
    })

    it('makes the URLs links with linkUrls, and still escapes the text', async () => {
        const html = await createReport(true)
        expect(html).toContain('<a href="https://webdriver.io/docs?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">https://webdriver.io/docs?a=1&amp;b=2</a>')
        expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;')
        // an apostrophe is part of a URL
        expect(html).toContain('<a href="https://example.com/O&#39;Reilly" target="_blank" rel="noopener noreferrer">https://example.com/O&#39;Reilly</a>')
    })

    it('does not put the punctuation after a URL in the link', async () => {
        const html = await createReport(true)
        const link = (url: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        expect(html).toContain(`Opened ${link('https://example.com/page')}.`)
        expect(html).toContain(`(see ${link('https://example.com/a')})`)
        // a closing parenthesis that has its opening one in the URL stays
        expect(html).toContain(`${link('https://en.wikipedia.org/wiki/Foo_(bar)')}, done`)
    })
})

describe('absolute outputDir and makeReport', () => {
    let absoluteDir: string

    beforeAll(async () => {
        absoluteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-reporter-absolute-')) + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: absoluteDir, filename: 'report.html', reportTitle: 'Absolute' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
    })

    afterAll(() => {
        fs.rmSync(absoluteDir, { recursive: true, force: true })
    })

    it('writes the worker JSON and the master report in an absolute outputDir', async () => {
        const reportAggregator = new ReportAggregator({ outputDir: absoluteDir, filename: 'master-report.html', reportTitle: 'Absolute master', browserName: 'chrome' } as never)
        expect(reportAggregator.readJsonFiles()).toHaveLength(1)
        await reportAggregator.createReport()
        expect(reportAggregator.reportFile).toBe(path.join(absoluteDir, 'master-report.html'))
        expect(fs.readFileSync(reportAggregator.reportFile, 'utf-8')).toContain('Absolute master')
    })

    it('makeReport reads the report name, folder and title arguments', async () => {
        const reportFile = await makeReport(['from-cli.html', absoluteDir, 'CLI title'], { CI: 'true' })
        expect(reportFile).toBe(path.join(absoluteDir, 'from-cli.html'))
        expect(fs.readFileSync(reportFile, 'utf-8')).toContain('CLI title')
    })
})

describe('video type', () => {
    let dir: string
    afterAll(() => {
        process.removeAllListeners('test:video-capture')
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('uses the type of the video file (the video reporter makes webm files by default)', async () => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-reporter-video-')) + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Video' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        fs.writeFileSync(path.join(dir, 'test.webm'), 'video')
        fs.writeFileSync(path.join(dir, 'test.mp4'), 'video')
        new ReportEvents().videoCapture(path.join(dir, 'test.webm')).videoCapture(path.join(dir, 'test.mp4'))
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        const reportAggregator = new ReportAggregator({ outputDir: dir, filename: 'master-report.html', reportTitle: 'Video', browserName: 'chrome' } as never)
        await reportAggregator.createReport()
        const html = fs.readFileSync(reportAggregator.reportFile, 'utf-8')
        expect(html).toContain('<source src="test.webm" type="video/webm">')
        expect(html).toContain('<source src="test.mp4" type="video/mp4">')
    })
})

describe('video that failed to render', () => {
    let dir: string
    afterAll(() => {
        process.removeAllListeners('test:video-capture')
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('shows no video player in the master report for a video file that does not exist', async () => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-reporter-no-video-')) + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Video' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        // the video reporter sends the path before the render, and the render failed
        fs.writeFileSync(path.join(dir, 'rendered.webm'), 'video')
        new ReportEvents().videoCapture(path.join(dir, 'failed.webm')).videoCapture(path.join(dir, 'rendered.webm'))
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        const reportAggregator = new ReportAggregator({ outputDir: dir, filename: 'master-report.html', reportTitle: 'Video', browserName: 'chrome' } as never)
        await reportAggregator.createReport()
        const html = fs.readFileSync(reportAggregator.reportFile, 'utf-8')
        expect(html).not.toContain('failed.webm')
        expect(html).toContain('<source src="rendered.webm" type="video/webm">')
    })
})

describe('Greptile review points', () => {
    const dirs: string[] = []
    const tempDir = (name: string) => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `html-reporter-${name}-`)) + path.sep
        dirs.push(dir)
        return dir
    }
    const suite = (extra: Record<string, unknown>) => ({
        ...SUITES[0],
        uid: 'review suite',
        title: 'Review suite',
        type: 'suite',
        tests: [],
        suites: [],
        hooks: [],
        ...extra
    }) as never

    afterAll(() => {
        for (const dir of dirs) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('creates the report again without the results of the previous master report', async () => {
        const dir = tempDir('again')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Again' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)

        const options = { outputDir: dir, filename: 'master-report.html', reportTitle: 'Again', browserName: 'chrome' }
        const first = new ReportAggregator(options)
        await first.createReport()
        await first.createReport()
        expect(first.reports).toHaveLength(1)

        const again = new ReportAggregator(options)
        expect(again.readJsonFiles()).toHaveLength(1)
        await again.createReport()
        const master = JSON.parse(fs.readFileSync(path.join(dir, 'master-report.json'), 'utf-8'))
        expect(master.metrics.passed).toBe(1)
        expect(master.suites).toHaveLength(1)
    })

    it('creates the screenshots folder inside an outputDir without a trailing slash', () => {
        const dir = tempDir('slash')
        new HtmlReporter({ logFile: os.devNull, outputDir: path.join(dir, 'html') } as never)
        expect(fs.existsSync(path.join(dir, 'html', 'screenshots'))).toBe(true)
        expect(fs.existsSync(path.join(dir, 'htmlscreenshots'))).toBe(false)
    })

    it('shows the error of a failed hook', async () => {
        const dir = tempDir('hook')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Hook' } as never)
        reporter.onRunnerStart(RUNNER)
        const failedSuite = suite({
            hooks: [{ uid: 'hook1', title: '"before all" hook for "Review suite"', state: 'failed', error: { message: 'cannot open the page', stack: 'Error: cannot open the page\n    at before' } }]
        })
        reporter.onSuiteStart(failedSuite)
        reporter.onSuiteEnd(failedSuite)
        await reporter.onRunnerEnd(RUNNER)
        const reportAggregator = new ReportAggregator({ outputDir: dir, filename: 'master-report.html', reportTitle: 'Hook', browserName: 'chrome' })
        await reportAggregator.createReport()
        const html = fs.readFileSync(reportAggregator.reportFile, 'utf-8')
        expect(html).toContain('&quot;before all&quot; hook for &quot;Review suite&quot;')
        expect(html).toContain('cannot open the page')
        expect(html).toContain('at before')
    })

    it('removes the output of the tests in nested suites', async () => {
        const dir = tempDir('nested')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Nested' } as never)
        reporter.onRunnerStart(RUNNER)
        const nested = suite({
            uid: 'nested suite',
            title: 'Nested suite',
            tests: [{ ...SUITES[0].tests[0], output: [{ type: 'command', value: 'a lot of data' }] }]
        })
        const parent = suite({ suites: [nested] })
        reporter.onSuiteStart(parent)
        reporter.onSuiteEnd(parent)
        await reporter.onRunnerEnd(RUNNER)
        const [workerJson] = new ReportAggregator({ outputDir: dir, filename: 'master-report.html', reportTitle: 'Nested', browserName: 'chrome' }).readJsonFiles()
        expect(fs.readFileSync(workerJson, 'utf-8')).not.toContain('a lot of data')
    })
})

describe('pending tests', () => {
    afterAll(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
    })

    it('counts a pending test as skipped (for example a pending scenario with scenarioLevelReporter)', () => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Pending' } as never)
        reporter.onRunnerStart(RUNNER)
        const [, , pending] = SUITES[0].tests
        reporter.onTestStart(pending)
        reporter.onTestPending({ ...pending, state: 'pending' } as TestStats)
        reporter.onTestEnd(pending)
        expect(reporter.metrics).toMatchObject({ passed: 0, failed: 0, skipped: 1 })
    })

    it('keeps the logs of a test that started and then is skipped (Jasmine pending())', async () => {
        const dir = path.join(outputRoot, 'started-then-skipped') + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Skipped' } as never)
        reporter.onRunnerStart(RUNNER)
        // the base reporter puts a new test object in place of the started one
        const test = { type: 'test:start', title: 'logs and then is pending', fullTitle: 'logs and then is pending', uid: 'spec0', cid: '0-0', parent: '', specs: [] }
        reporter.emit('test:start', test)
        new ReportEvents().logMessage('a message before pending')
        reporter.emit('test:pending', { ...test, type: 'test:pending', state: 'skipped', pendingReason: 'not ready' })
        await reporter.onRunnerEnd(RUNNER)
        const json = JSON.parse(fs.readFileSync(path.join(dir, 'report-0-0.json'), 'utf-8'))
        const tests = json.suites.flatMap((suite: { tests: { title: string, events?: unknown[] }[] }) => suite.tests)
        expect(tests).toHaveLength(1)
        expect(tests[0].events).toEqual([{ type: 'log', value: 'a message before pending' }])
    })
})

describe('failed hooks', () => {
    afterAll(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
    })

    const failedHook = { uid: 'hook-1', title: '"before all" hook', error: { name: 'Error', message: 'hook fails' } }
    const start = () => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Hooks' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        return reporter
    }

    const failHook = (reporter: HtmlReporter, hook: Record<string, unknown> = {}) => {
        const payload = { ...failedHook, cid: '0-0', parent: SUITES[0].title, ...hook }
        reporter.emit('hook:start', payload)
        reporter.emit('hook:end', payload)
    }
    const failTest = (reporter: HtmlReporter, uid: string, contextId?: string) => {
        const test = { type: 'test:start', title: uid, fullTitle: uid, uid, cid: '0-0', parent: SUITES[0].title, contextId }
        reporter.emit('test:start', test)
        reporter.emit('test:fail', { ...test, error: { message: 'fails' } })
        reporter.emit('test:end', test)
    }

    it('counts a failed before hook one time when Mocha fails the tests that it affects', () => {
        const reporter = start()
        failHook(reporter)
        for (const uid of ['t1', 't2', 't3']) {
            failTest(reporter, uid)
        }
        reporter.onSuiteEnd(SUITES[0])
        // 3 tests: the failures of the tests show the failure of the hook
        expect(reporter.metrics).toMatchObject({ passed: 0, failed: 3 })
    })

    it('counts a failed hook that fails no test (an after hook)', () => {
        const reporter = start()
        const test = SUITES[0].tests[0]
        reporter.onTestStart(test)
        reporter.onTestPass(test)
        failHook(reporter, { title: '"after all" hook' })
        reporter.onSuiteEnd(SUITES[0])
        expect(reporter.metrics).toMatchObject({ passed: 1, failed: 1 })
    })

    it('keeps a failed hook of a parallel-mode test when a test of another context fails', () => {
        const reporter = start()
        failHook(reporter, { title: '"after each" hook', contextId: 'context-a' })
        failTest(reporter, 't2', 'context-b')
        reporter.onSuiteEnd(SUITES[0])
        expect(reporter.metrics).toMatchObject({ failed: 2 })
    })

    // the events of @wdio/vitest-framework: a failed attempt ends with test:retry, its hooks have `retried: true`
    const retryVitestTest = (reporter: HtmlReporter, kind: 'beforeEach' | 'afterEach', contextId?: string) => {
        const test = (uid: string) => ({ type: 'test:start', title: 'flaky', fullTitle: 'flaky', uid, cid: '0-0', parent: SUITES[0].title, contextId })
        const hook = (uid: string, state: 'fail' | 'pass', retried?: boolean) => failHook(reporter, {
            uid: `${uid}-${kind}`, title: `"${kind}" hook for "flaky"`, contextId, state, retried,
            error: state === 'fail' ? { name: 'Error', message: `${kind} fails` } : undefined
        })
        reporter.emit('test:start', test('t1'))
        if (kind === 'beforeEach') {
            hook('t1', 'fail', true)
        }
        reporter.emit('test:retry', { ...test('t1'), error: { message: `${kind} fails` } })
        if (kind === 'afterEach') {
            hook('t1', 'fail', true)
        }
        reporter.emit('test:start', { ...test('t1-retry-1'), retries: 1 })
        hook('t1-retry-1', 'pass')
        reporter.emit('test:pass', test('t1-retry-1'))
        reporter.emit('test:end', test('t1-retry-1'))
    }

    it('does not count a failed beforeEach hook of a retried Vitest attempt (parallel mode)', () => {
        const reporter = start()
        retryVitestTest(reporter, 'beforeEach', 'context-a')
        reporter.onSuiteEnd(SUITES[0])
        expect(reporter.metrics).toMatchObject({ passed: 1, failed: 0 })
    })

    // Vitest fails the test with the afterEach error, then sends the hook with failedTestUid
    it('does not count a failed Vitest afterEach that is the failure of its test', () => {
        const reporter = start()
        const test = { type: 'test:start', title: 't', fullTitle: 't', uid: 't1', cid: '0-0', parent: SUITES[0].title }
        reporter.emit('test:start', test)
        reporter.emit('test:fail', { ...test, error: { message: 'afterEach fails' } })
        reporter.emit('test:end', test)
        failHook(reporter, { uid: 't1-afterEach', title: '"after each" hook for "t"', state: 'fail', failedTestUid: 't1', error: { name: 'Error', message: 'afterEach fails' } })
        reporter.onSuiteEnd(SUITES[0])
        expect(reporter.metrics).toMatchObject({ passed: 0, failed: 1 })
    })

    it('does not count a failed afterEach hook of a retried Vitest attempt', () => {
        const reporter = start()
        retryVitestTest(reporter, 'afterEach')
        reporter.onSuiteEnd(SUITES[0])
        expect(reporter.metrics).toMatchObject({ passed: 1, failed: 0 })
    })
})

describe('tests with no describe()', () => {
    it('writes the tests of the root suite in the report (Mocha top-level it())', async () => {
        const dir = path.join(outputRoot, 'root-tests') + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Root' } as never)
        reporter.onRunnerStart(RUNNER)
        // the base reporter puts a test with no suite in its root suite
        const test = { type: 'test:start', title: 'a top-level test', fullTitle: 'a top-level test', uid: 'root-test', cid: '0-0', parent: '', specs: [] }
        reporter.emit('test:start', test)
        reporter.emit('test:fail', { ...test, error: { message: 'top-level failure' } })
        reporter.emit('test:end', test)
        await reporter.onRunnerEnd(RUNNER)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        const json = JSON.parse(fs.readFileSync(path.join(dir, 'report-0-0.json'), 'utf-8'))
        expect(json.metrics.failed).toBe(1)
        expect(json.suites.flatMap((suite: { tests: { title: string }[] }) => suite.tests.map((t) => t.title))).toEqual(['a top-level test'])
    })

    const removeListeners = () => ['test:log', 'test:screenshot', 'test:video-capture'].forEach((event) => process.removeAllListeners(event))
    type JsonSuite = { title: string, hooks: { title: string, output?: { type: string, body?: { url?: string } }[] }[] }
    // Mocha before() / after() outside every describe(), Jasmine top-level beforeAll / afterAll
    type RootRun = { commands?: boolean, specs?: string[], file?: string, rootError?: boolean }
    const rootHooks = async (name: string, options: object, { commands = true, specs = ['/spec.js'], file = '/spec.js', rootError = false }: RootRun = {}) => {
        const dir = path.join(outputRoot, name) + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Root hooks', ...options } as never)
        const emit = (event: string, payload: Record<string, unknown>) => reporter.emit(event, { type: event, cid: '0-0', specs, file, ...payload })
        emit('runner:start', { config: { framework: 'mocha' }, capabilities: { browserName: 'chrome' }, sessionId: 's', isMultiRemote: false, instanceOptions: {} })
        const hook = (uid: string, kind: 'before' | 'after') => {
            const payload = { uid, title: `"${kind} all" hook in "{root}"`, parent: '', hookKind: `${kind}All` }
            emit('hook:start', payload)
            if (commands) {
                const command = { sessionId: 's', method: 'POST', endpoint: '/session/:sessionId/url', body: { url: `${kind}-url` } }
                reporter.emit('client:beforeCommand', command)
                reporter.emit('client:afterCommand', { ...command, result: { value: null } })
            }
            emit('hook:end', rootError && kind === 'before' ? { ...payload, error: { message: 'root setup failed', stack: 'Error: root setup failed' } } : payload)
        }
        const test = { uid: 't1', title: 'o1', fullTitle: 'outer o1', parent: 'outer' }
        hook('root-before', 'before')
        emit('suite:start', { uid: 'outer', title: 'outer', fullTitle: 'outer', parent: '' })
        emit('test:start', test)
        emit('test:pass', test)
        emit('test:end', test)
        emit('suite:end', { uid: 'outer', title: 'outer', fullTitle: 'outer', parent: '' })
        hook('root-after', 'after')
        await reporter.onRunnerEnd(reporter.runnerStat!)
        removeListeners()
        return JSON.parse(fs.readFileSync(path.join(dir, 'report-0-0.json'), 'utf-8')).suites as JsonSuite[]
    }
    const htmlOf = (name: string) => fs.readFileSync(path.join(outputRoot, name, 'report-0-0.html'), 'utf-8')
    // the spec file row: the paths after the working folder; nunjucks escapes the backslashes of Windows
    const specRow = (...files: string[]) => `<td>${files.map((file) => file.slice(process.cwd().length)).join(', ').replaceAll('\\', '&#92;')}</td>`

    it('writes the root suite with the commands of its hooks, removeOutput: false', async () => {
        const suites = await rootHooks('root-hooks-output', { removeOutput: false })
        expect(suites.map((suite) => suite.title)).toEqual(['(root)', 'outer'])
        expect(suites[0].hooks.map((hook) => [hook.title, hook.output?.filter((o) => o.type === 'command').map((o) => o.body?.url)])).toEqual([
            ['"before all" hook in "{root}"', ['before-url']],
            ['"after all" hook in "{root}"', ['after-url']],
        ])
        // the page does not read the spec file of a hook
        expect(suites[0].hooks.filter((hook) => 'file' in hook)).toEqual([])
    })

    it('does not show a root suite with only passed hooks, but keeps their commands in the JSON file', async () => {
        const suites = await rootHooks('root-hooks-hidden', { removeOutput: false, produceHtml: true })
        expect(suites.map((suite) => suite.title)).toEqual(['(root)', 'outer'])
        const html = htmlOf('root-hooks-hidden')
        expect(html).toContain('&nbsp;</span>outer')
        expect(html).not.toContain('&nbsp;</span>(root)')
        // no empty row of the hidden suite
        expect(html).not.toMatch(/<tr>\s*<td colspan="2">\s*<\/td>\s*<\/tr>/)
    })

    it('shows a root suite with a failed hook', async () => {
        await rootHooks('root-hook-failed', { produceHtml: true }, { rootError: true })
        const html = htmlOf('root-hook-failed')
        expect(html).toContain('&nbsp;</span>(root)')
        expect(html).toContain('Hook failed: &quot;before all&quot; hook in &quot;{root}&quot;: root setup failed')
    })

    // the runner gives the spec files as URLs, the framework gives each suite the path of its spec file
    it('shows the spec file of the root suite as a path, and keeps the row of the first suite', async () => {
        const spec = path.resolve('project', 'spec.js')
        const suites = await rootHooks('root-spec-path', { produceHtml: true }, { specs: [url.pathToFileURL(spec).href], file: spec, rootError: true }) as (JsonSuite & { file: string })[]
        expect(suites[0].file).toBe(spec)
        const [root, outer] = htmlOf('root-spec-path').split('&nbsp;</span>outer')
        expect(root + outer).not.toContain('file://')
        // a filter can hide the (root) box: the first suite of the file keeps its own row
        expect(root).toContain(specRow(spec))
        expect(outer).toContain(specRow(spec))
    })

    // grouped spec files: Mocha gives each root test the spec file it comes from
    const [firstSpec, secondSpec] = ['first.spec.js', 'second.spec.js'].map((name) => path.resolve('project', name))
    // resolved now: a test can change the working folder
    const reportsDir = path.resolve(outputRoot)
    const rootTests = async (name: string, files: string[]) => {
        const dir = path.join(reportsDir, name) + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Root tests', produceHtml: true } as never)
        const emit = (event: string, payload: Record<string, unknown>) => reporter.emit(event, { type: event, cid: '0-0', specs: [firstSpec, secondSpec].map((spec) => url.pathToFileURL(spec).href), ...payload })
        emit('runner:start', { config: { framework: 'mocha' }, capabilities: { browserName: 'chrome' }, sessionId: 's', isMultiRemote: false, instanceOptions: {} })
        files.forEach((file, index) => {
            const test = { uid: `root-test-${index}`, title: `root test ${index}`, fullTitle: `root test ${index}`, parent: '', file }
            emit('test:start', test)
            emit('test:pass', test)
            emit('test:end', test)
        })
        await reporter.onRunnerEnd(reporter.runnerStat!)
        removeListeners()
        return JSON.parse(fs.readFileSync(path.join(dir, 'report-0-0.json'), 'utf-8')).suites as (JsonSuite & { file: string, files?: string[], isRoot?: boolean, tests: Record<string, unknown>[] })[]
    }

    it('shows the spec file of the root tests of a worker with several spec files', async () => {
        const [root] = await rootTests('root-tests-grouped', [secondSpec])
        expect(root.isRoot).toBe(true)
        expect(root.file).toBe(secondSpec)
        // the page does not read the spec file of a test
        expect(root.tests.filter((test) => 'file' in test)).toEqual([])
        expect(htmlOf('root-tests-grouped')).toContain(specRow(secondSpec))
    })

    it('shows each spec file of root tests that come from several spec files', async () => {
        const [root] = await rootTests('root-tests-two-files', [firstSpec, secondSpec, firstSpec])
        // `file` stays one path, as on the other suites
        expect(root.file).toBe(firstSpec)
        expect(root.files).toEqual([firstSpec, secondSpec])
        expect(htmlOf('root-tests-two-files')).toContain(specRow(firstSpec, secondSpec))
    })

    it('removes the working folder only at the start of each spec file', async () => {
        // the working folder again inside the path, without its root (a drive letter cannot be in a Windows path)
        const cwd = process.cwd()
        const [first, second] = [firstSpec, secondSpec].map((spec) => path.join(cwd, cwd.slice(path.parse(cwd).root.length), path.basename(spec)))
        await rootTests('root-tests-nested', [first, second])
        expect(htmlOf('root-tests-nested')).toContain(specRow(first, second))
    })

    it('names a spec file once when one root test gives it as a URL', async () => {
        const [root] = await rootTests('root-tests-url', [firstSpec, url.pathToFileURL(firstSpec).href])
        expect(root.file).toBe(firstSpec)
        expect(root).not.toHaveProperty('files')
        expect(htmlOf('root-tests-url')).toContain(specRow(firstSpec))
    })

    it('keeps the full path of a spec file in a folder next to the working folder', async () => {
        const sibling = `${process.cwd()}-e2e${path.sep}login.spec.js`
        await rootTests('root-tests-sibling', [sibling])
        expect(htmlOf('root-tests-sibling')).toContain(`<td>${sibling.replaceAll('\\', '&#92;')}</td>`)
    })

    // Windows: a path can have another case of the drive letter, or `/` (Vitest)
    it.runIf(process.platform === 'win32')('removes the working folder from a Windows path with another drive letter case or with /', async () => {
        const cwd = process.cwd()
        const lowerDrive = cwd[0].toLowerCase() + cwd.slice(1) + '\\project\\first.spec.js'
        const slashes = cwd.replaceAll('\\', '/') + '/project/second.spec.js'
        await rootTests('root-tests-windows', [lowerDrive, slashes])
        expect(htmlOf('root-tests-windows')).toContain('<td>&#92;project&#92;first.spec.js, &#92;project&#92;second.spec.js</td>')
    })

    it('keeps a spec file whole when the working folder has a comma', async () => {
        const cwd = path.join(process.cwd(), 'Work, Inc')
        const spec = path.join(cwd, 'project', 'first.spec.js')
        const spy = vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        try {
            await rootTests('root-tests-comma', [spec])
            expect(htmlOf('root-tests-comma')).toContain(specRow(spec))
        } finally {
            spy.mockRestore()
        }
    })

    it('shows no spec file on a root suite with only hooks in a worker with several spec files', async () => {
        // grouped spec files: the root tests and hooks can come from any of them
        const suites = await rootHooks('root-grouped-specs', { produceHtml: true }, { specs: [firstSpec, secondSpec].map((spec) => url.pathToFileURL(spec).href), file: firstSpec, rootError: true }) as (JsonSuite & { file: string })[]
        expect(suites[0].file).toBe('')
        const [root, outer] = htmlOf('root-grouped-specs').split('&nbsp;</span>outer')
        expect(root).toContain('&nbsp;</span>(root)')
        expect(root).not.toContain('<td>Spec File</td>')
        expect(outer).toContain('<td>Spec File</td>')
    })

    it('shows a suite with no test that is not the root suite', async () => {
        const dir = path.join(outputRoot, 'empty-suite') + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Empty', produceHtml: true } as never)
        const emit = (event: string, payload: Record<string, unknown>) => reporter.emit(event, { type: event, cid: '0-0', specs: ['/spec.feature'], file: '/spec.feature', ...payload })
        emit('runner:start', { config: { framework: 'cucumber' }, capabilities: { browserName: 'chrome' }, sessionId: 's', isMultiRemote: false, instanceOptions: {} })
        // a Cucumber scenario with no step
        const feature = { uid: 'feature', title: 'Feature', fullTitle: 'Feature', parent: '' }
        const scenario = { uid: 'scenario', title: 'Has no step', fullTitle: 'Feature: Has no step', parent: 'feature' }
        emit('suite:start', feature)
        emit('suite:start', scenario)
        emit('suite:end', scenario)
        emit('suite:end', feature)
        await reporter.onRunnerEnd(reporter.runnerStat!)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        expect(htmlOf('empty-suite')).toContain('&nbsp;</span>Has no step')
    })

    it('does not write a root suite with only passed hooks, removeOutput: true', async () => {
        const suites = await rootHooks('root-hooks-no-output', {})
        expect(suites.map((suite) => suite.title)).toEqual(['outer'])
    })

    it('does not write a root suite with passed hooks that have no command, removeOutput: false', async () => {
        const suites = await rootHooks('root-hooks-no-command', { removeOutput: false }, { commands: false })
        expect(suites.map((suite) => suite.title)).toEqual(['outer'])
    })
})

describe('suite state', () => {
    it('does not show a suite as passed when a child suite or a hook failed', async () => {
        const dir = path.join(outputRoot, 'suite-state') + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'State', produceHtml: true } as never)
        reporter.onRunnerStart(RUNNER)
        const common = { cid: '0-0', specs: [], file: 'spec.js' }
        const suite = (uid: string, title: string, parent = '') => ({ ...common, type: 'suite:start', uid, title, fullTitle: title, parent })
        const test = (uid: string, title: string, parent: string) => ({ ...common, type: 'test:start', uid, title, fullTitle: title, parent })
        reporter.emit('suite:start', suite('parent', 'parent suite'))
        reporter.emit('test:start', test('t1', 'parent test passes', 'parent'))
        reporter.emit('test:pass', test('t1', 'parent test passes', 'parent'))
        reporter.emit('suite:start', suite('child', 'child suite', 'parent'))
        reporter.emit('test:start', test('t2', 'child test fails', 'child'))
        reporter.emit('test:fail', { ...test('t2', 'child test fails', 'child'), error: { message: 'child failure' } })
        reporter.emit('suite:end', suite('child', 'child suite', 'parent'))
        reporter.emit('suite:end', suite('parent', 'parent suite'))
        reporter.emit('suite:start', suite('hooked', 'suite with a failed after hook'))
        reporter.emit('test:start', test('t3', 'test passes', 'hooked'))
        reporter.emit('test:pass', test('t3', 'test passes', 'hooked'))
        reporter.emit('hook:start', { ...common, type: 'hook:start', uid: 'h1', title: '"after all" hook', parent: 'hooked' })
        reporter.emit('hook:end', { ...common, type: 'hook:end', uid: 'h1', title: '"after all" hook', parent: 'hooked', error: { message: 'hook failure' } })
        reporter.emit('suite:end', suite('hooked', 'suite with a failed after hook'))
        await reporter.onRunnerEnd(RUNNER)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        const html = fs.readFileSync(path.join(dir, 'report-0-0.html'), 'utf-8')
        const classOf = (title: string) => {
            const index = html.indexOf(`&nbsp;</span>${title}`)
            return html.slice(0, index).match(/suite-(pass|fail|pending|unknown)/g)?.pop()
        }
        expect(classOf('child suite')).toBe('suite-fail')
        expect(classOf('parent suite')).toBe('suite-fail')
        expect(classOf('suite with a failed after hook')).toBe('suite-fail')
    })
})

describe('retries and hooks of a feature', () => {
    const common = { cid: '0-0', specs: [], file: 'spec.js' }
    const suite = (uid: string, type = 'suite:start', parent = '') => ({ ...common, type, uid, title: uid, fullTitle: uid, parent, parentUid: parent || null })
    const test = (uid: string, title: string, parent: string) => ({ ...common, type: 'test:start', uid, title, fullTitle: `${parent} ${title}`, parent, parentUid: parent })
    const cucumber = Object.assign(Object.create(Object.getPrototypeOf(RUNNER)), RUNNER, { config: { framework: 'cucumber' } })
    const run = async (name: string, events: (reporter: HtmlReporter) => void, runner = RUNNER) => {
        const dir = path.join(outputRoot, name) + path.sep
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Retries', produceHtml: true } as never)
        reporter.onRunnerStart(runner)
        events(reporter)
        await reporter.onRunnerEnd(runner)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        const html = fs.readFileSync(path.join(dir, 'report-0-0.html'), 'utf-8')
        const classOf = (title: string) => html.slice(0, html.indexOf(`&nbsp;</span>${title}`)).match(/suite-(pass|fail|pending|unknown)/g)?.pop()
        // the class of each entry with this title, in report order
        const classesOf = (title: string) => html.split(`&nbsp;</span>${title}`).slice(0, -1).map((before) => before.match(/suite-(pass|fail|pending|unknown)/g)?.pop())
        return { reporter, classOf, classesOf, json: JSON.parse(fs.readFileSync(path.join(dir, 'report-0-0.json'), 'utf-8')) }
    }

    // Mocha `retries`, a failed attempt ends with test:retry and the next attempt has a new uid
    it('shows a suite with a test that passed on retry as passed', async () => {
        const { classOf } = await run('k24-flaky', (reporter) => {
            reporter.emit('suite:start', suite('flaky suite'))
            reporter.emit('test:start', test('t1', 'flaky', 'flaky suite'))
            reporter.emit('test:retry', { ...test('t1', 'flaky', 'flaky suite'), error: { message: 'first attempt' } })
            reporter.emit('test:start', { ...test('t1-retry', 'flaky', 'flaky suite'), retries: 1 })
            reporter.emit('test:pass', test('t1-retry', 'flaky', 'flaky suite'))
            reporter.emit('test:end', test('t1-retry', 'flaky', 'flaky suite'))
            reporter.emit('suite:end', suite('flaky suite'))
        })
        expect(classOf('flaky suite')).toBe('suite-pass')
    })

    // Mocha `retries`, Cucumber scenario level and Vitest retry a test: each failed attempt is its own entry
    it.each([
        ['a new uid for each attempt (Mocha)', (attempt: number) => attempt ? `t1-retry${attempt}` : 't1'],
        ['the same uid for each attempt (Cucumber scenario level)', () => 't1']
    ])('labels the failed attempts of a retried test, %s', async (_name, uid) => {
        const { json } = await run(`retried-test-${uid(1)}`, (reporter) => {
            reporter.emit('suite:start', suite('flaky suite'))
            for (const attempt of [0, 1]) {
                reporter.emit('test:start', { ...test(uid(attempt), 'flaky', 'flaky suite'), retries: attempt })
                reporter.emit('test:retry', { ...test(uid(attempt), 'flaky', 'flaky suite'), error: { message: `attempt ${attempt + 1}` } })
            }
            reporter.emit('test:start', { ...test(uid(2), 'flaky', 'flaky suite'), retries: 2 })
            reporter.emit('test:pass', test(uid(2), 'flaky', 'flaky suite'))
            reporter.emit('test:end', test(uid(2), 'flaky', 'flaky suite'))
            reporter.emit('suite:end', suite('flaky suite'))
        })
        expect(json.suites[0].tests.map((entry: { title: string, state: string }) => [entry.title, entry.state])).toEqual([
            ['flaky (attempt 1, retried)', 'failed'],
            ['flaky (attempt 2, retried)', 'failed'],
            ['flaky', 'passed']
        ])
        // the page shows the error of each failed attempt
        expect(json.suites[0].tests.map((entry: { events: { type: string, value: { message: string } }[] }) => entry.events.filter((event) => event.type === 'Error').map((event) => event.value.message))).toEqual([
            ['attempt 1'],
            ['attempt 2'],
            []
        ])
    })

    // @wdio/vitest-framework sends the failed hook of a retried attempt with `retried: true`
    it('shows a suite with a failed hook of a retried attempt as passed when the test passed on retry', async () => {
        const { classOf } = await run('k24-hook', (reporter) => {
            const hook = { ...common, type: 'hook:start', uid: 't1-beforeEach', title: '"beforeEach" hook for "flaky"', parent: 'hook suite', parentUid: 'hook suite' }
            reporter.emit('suite:start', suite('hook suite'))
            reporter.emit('test:start', test('t1', 'flaky', 'hook suite'))
            reporter.emit('hook:start', hook)
            reporter.emit('hook:end', { ...hook, retried: true, error: { message: 'beforeEach fails' } })
            reporter.emit('test:retry', { ...test('t1', 'flaky', 'hook suite'), error: { message: 'beforeEach fails' } })
            reporter.emit('test:start', { ...test('t1-retry-1', 'flaky', 'hook suite'), retries: 1 })
            reporter.emit('test:pass', test('t1-retry-1', 'flaky', 'hook suite'))
            reporter.emit('test:end', test('t1-retry-1', 'flaky', 'hook suite'))
            reporter.emit('suite:end', suite('hook suite'))
        })
        expect(classOf('hook suite')).toBe('suite-pass')
    })

    // Cucumber `retry` (step level) ends the failed step with test:retry, then sends suite:retry in place of the suite:start of the next attempt
    it.each([
        ['', []],
        [' and skipped steps after the failed step', ['skipped']]
    ])('keeps the failed attempt of a retried Cucumber scenario as its own failed entry, with its own times%s', async (_name, after) => {
        vi.useFakeTimers({ toFake: ['Date'] })
        const at = (time: string) => vi.setSystemTime(new Date(`2026-10-25T10:00:${time}.000Z`))
        try {
            const { json, reporter, classesOf } = await run(`k12-retry-${after.length}`, (reporter) => {
                at('00')
                reporter.emit('suite:start', suite('F', 'feature'))
                reporter.emit('suite:start', suite('S', 'scenario', 'F'))
                reporter.emit('test:start', test('step', 'a step', 'S'))
                at('02')
                reporter.emit('test:retry', { ...test('step', 'a step', 'S'), error: { message: 'first attempt' } })
                reporter.emit('test:end', test('step', 'a step', 'S'))
                if (after.length) {
                    reporter.emit('test:start', test('step-2', 'next step', 'S'))
                    reporter.emit('test:skip', test('step-2', 'next step', 'S'))
                    reporter.emit('test:end', test('step-2', 'next step', 'S'))
                }
                at('03')
                reporter.emit('suite:retry', suite('S', 'scenario', 'F'))
                for (const [uid, title] of [['step', 'a step'], ...(after.length ? [['step-2', 'next step']] : [])]) {
                    reporter.emit('test:start', test(uid, title, 'S'))
                    at('07')
                    reporter.emit('test:pass', test(uid, title, 'S'))
                    reporter.emit('test:end', test(uid, title, 'S'))
                }
                reporter.emit('suite:end', suite('S', 'scenario', 'F'))
                reporter.emit('suite:end', suite('F', 'feature'))
            }, cucumber)
            const [feature] = json.suites
            const attempts = feature.suites.map((entry: { title: string, start: string, end: string, _duration: number, tests: { state: string }[] }) => ({
                title: entry.title, start: entry.start, end: entry.end, duration: entry._duration, states: entry.tests.map((step) => step.state)
            }))
            // the scenario has the label, not its failed step
            expect(feature.suites[0].tests[0].title).toBe('a step')
            expect(attempts).toEqual([
                { title: 'S (attempt 1, retried)', start: '2026-10-25T10:00:00.000Z', end: '2026-10-25T10:00:03.000Z', duration: 3000, states: ['failed', ...after] },
                // the scenario keeps the start of its first attempt and the duration of all attempts, as main
                { title: 'S', start: '2026-10-25T10:00:00.000Z', end: '2026-10-25T10:00:07.000Z', duration: 7000, states: ['passed', ...after.map(() => 'passed')] }
            ])
            // the failed attempt shows as failed, the scenario as its last attempt
            expect(classesOf('S')).toEqual(['suite-fail', 'suite-pass'])
            // the scenario counts one time, as its last attempt
            expect(reporter.metrics).toMatchObject({ passed: 1, failed: 0 })
        } finally {
            vi.useRealTimers()
        }
    })

    it('gives the second failed attempt of a Cucumber scenario its own times and attempt label', async () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        const at = (time: string) => vi.setSystemTime(new Date(`2026-10-25T10:00:${time}.000Z`))
        try {
            const { json } = await run('k12-retry-twice', (reporter) => {
                at('00')
                reporter.emit('suite:start', suite('F', 'feature'))
                reporter.emit('suite:start', suite('S', 'scenario', 'F'))
                for (const [retryAt, endAt] of [['02', '03'], ['05', '06']]) {
                    reporter.emit('test:start', test('step', 'a step', 'S'))
                    at(retryAt)
                    reporter.emit('test:retry', { ...test('step', 'a step', 'S'), error: { message: 'failed attempt' } })
                    reporter.emit('test:end', test('step', 'a step', 'S'))
                    at(endAt)
                    reporter.emit('suite:retry', suite('S', 'scenario', 'F'))
                }
                reporter.emit('test:start', test('step', 'a step', 'S'))
                at('08')
                reporter.emit('test:pass', test('step', 'a step', 'S'))
                reporter.emit('test:end', test('step', 'a step', 'S'))
                reporter.emit('suite:end', suite('S', 'scenario', 'F'))
                reporter.emit('suite:end', suite('F', 'feature'))
            }, cucumber)
            const times = json.suites[0].suites.map((entry: { title: string, start: string, end: string }) => [entry.title, entry.start.slice(17, 19), entry.end.slice(17, 19)])
            expect(times).toEqual([['S (attempt 1, retried)', '00', '03'], ['S (attempt 2, retried)', '03', '06'], ['S', '00', '08']])
        } finally {
            vi.useRealTimers()
        }
    })

    // a failed Cucumber BeforeAll is a hook of the feature, and Cucumber runs no scenario after it
    it('shows and counts a failed Cucumber BeforeAll of the feature', async () => {
        const hook = { ...common, type: 'hook:start', uid: 'run-hook', title: 'BeforeAll', parent: 'F', parentUid: 'F', hookKind: 'beforeAll' }
        const { json, reporter } = await run('k26-before-all', (reporter) => {
            reporter.emit('suite:start', suite('F', 'feature'))
            reporter.emit('hook:start', hook)
            reporter.emit('hook:end', { ...hook, error: { message: 'BeforeAll fails' } })
            reporter.emit('suite:start', suite('S', 'scenario', 'F'))
            reporter.emit('test:start', test('step', 'a step', 'S'))
            reporter.emit('test:skip', test('step', 'a step', 'S'))
            reporter.emit('test:end', test('step', 'a step', 'S'))
            reporter.emit('suite:end', suite('S', 'scenario', 'F'))
            reporter.emit('suite:end', suite('F', 'feature'))
        }, cucumber)
        expect(json.suites[0].hooks.map((entry: { error?: { message: string } }) => entry.error?.message)).toEqual(['BeforeAll fails'])
        expect(reporter.metrics).toMatchObject({ passed: 0, skipped: 1, failed: 1 })
    })
})

describe('code review points', () => {
    const dirs: string[] = []
    const tempDir = (name: string) => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `html-reporter-${name}-`)) + path.sep
        dirs.push(dir)
        return dir
    }

    afterAll(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        vi.restoreAllMocks()
        for (const dir of dirs) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('links a screenshot whose file name has # or % in it', async () => {
        const dir = tempDir('link-names')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Names' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        const file = path.join(dir, 'screenshots', 'issue #12 at 50%.png')
        fs.writeFileSync(file, 'png')
        new ReportEvents().logScreenshot(file)
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        const reportAggregator = new ReportAggregator({ outputDir: dir, filename: 'master-report.html', reportTitle: 'Names', browserName: 'chrome', linkScreenshots: true })
        await reportAggregator.createReport()
        const html = fs.readFileSync(reportAggregator.reportFile, 'utf-8')
        const src = html.match(/<img[^>]*src="([^"]+)"/)?.[1]
        // the browser resolves the link next to the report: it must give the file
        expect(new URL(src!, url.pathToFileURL(reportAggregator.reportFile)).href).toBe(url.pathToFileURL(file).href)
    })

    it('writes the end of the run in the same format as its start', async () => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: tempDir('dates'), filename: 'report.html', reportTitle: 'Dates' } as never)
        reporter.onRunnerStart(RUNNER)
        await reporter.onRunnerEnd(RUNNER)
        const format = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        expect(reporter.metrics.start).toMatch(format)
        expect(reporter.metrics.end).toMatch(format)
    })
})

describe('second code review points', () => {
    const dirs: string[] = []
    const tempDir = (name: string) => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `html-reporter-${name}-`))
        dirs.push(dir)
        return dir
    }
    const runWorker = async (outputDir: string, options: Record<string, unknown> = {}) => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Review', ...options } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        const file = path.join(outputDir, 'screenshots', 'shot.png')
        fs.writeFileSync(file, 'png')
        new ReportEvents().logScreenshot(file)
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        return file
    }

    afterAll(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        for (const dir of dirs) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('writes valid script options when collapseTests and collapseSuites are undefined', async () => {
        const dir = tempDir('collapse')
        await runWorker(dir)
        const reportAggregator = new ReportAggregator({ outputDir: dir, filename: 'master.html', reportTitle: 'Collapse', collapseTests: undefined, collapseSuites: undefined })
        await reportAggregator.createReport()
        const html = fs.readFileSync(reportAggregator.reportFile, 'utf-8')
        expect(html).not.toMatch(/if \(\s*\)/)
        expect(html.match(/if \((true|false)\) \{/g)).toHaveLength(2)
    })
})

describe('third code review points', () => {
    const dirs: string[] = []
    const tempDir = (name: string) => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `html-reporter-${name}-`))
        dirs.push(dir)
        return dir
    }
    const failedTest = (error: unknown) => ({ ...SUITES[0].tests[1], uid: 'error-test', title: 'error test', state: 'failed', errors: [error], error, events: undefined }) as unknown as TestStats

    afterAll(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        vi.restoreAllMocks()
        for (const dir of dirs) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    const masterOf = async (dir: string, error: unknown) => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', reportTitle: 'Errors' } as never)
        const suite = { ...SUITES[0], uid: 'errors', title: 'Errors', tests: [] as TestStats[] }
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(suite as never)
        const test = failedTest(error)
        suite.tests.push(test)
        reporter.onTestStart(test)
        reporter.onTestFail(test)
        reporter.onTestEnd(test)
        reporter.onSuiteEnd(suite as never)
        await reporter.onRunnerEnd(RUNNER)
        const reportAggregator = new ReportAggregator({ outputDir: dir, filename: 'master.html', reportTitle: 'Errors' })
        await reportAggregator.createReport()
        return fs.readFileSync(reportAggregator.reportFile, 'utf-8')
    }

    it('keeps the message and the stack of an Error instance in the master report', async () => {
        // a framework can give an Error object: its message and stack are not own enumerable fields
        const html = await masterOf(tempDir('error-instance'), new Error('Spec has no expectations'))
        expect(html).toContain('Assertion: Spec has no expectations')
        expect(html).toContain('<pre class=\'pre stack panel\'>Error: Spec has no expectations')
    })

    it('can expand an error row that has no stack', async () => {
        const html = await masterOf(tempDir('no-stack'), { message: 'no stack', stack: '' })
        expect(html).not.toContain('<pre class=\'pre stack panel\'>')
        // the click handler of the row looks for the stack row after it (the browser check is in the PR)
        expect(html).toMatch(/let panel = event\.currentTarget\.nextElementSibling\?\.querySelector\('\.pre\.stack\.panel'\);\s*if \(panel\) \{/)
    })

    it('closes the row of each test', async () => {
        const html = await masterOf(tempDir('rows'), { message: 'a failure', stack: 'Error: a failure' })
        expect(html).toContain('<table class="table table-test">')
        // a new <tr> in place of </tr> gives an empty row after each test
        expect(html).not.toMatch(/<\/td>\s*<tr>\s*<\/table>/)
    })

    it('tells on the console when the HTML report of a worker is not complete', async () => {
        const { default: HtmlGenerator } = await import('../src/htmlGenerator.js')
        const htmlOutput = vi.spyOn(HtmlGenerator, 'htmlOutput').mockResolvedValue(false)
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        try {
            const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: tempDir('worker-html'), filename: 'report.html', reportTitle: 'Worker', produceHtml: true } as never)
            reporter.onRunnerStart(RUNNER)
            await reporter.onRunnerEnd(RUNNER)
            expect(error.mock.calls.some(([message]) => String(message).includes('report-0-0.html is not complete'))).toBe(true)
        } finally {
            htmlOutput.mockRestore()
            error.mockRestore()
        }
    })
})

describe('parallel mode', () => {
    const dir = path.join(outputRoot, 'parallel') + path.sep
    let context: string | undefined
    const start = (options: Record<string, unknown> = {}) => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html', ...options } as never)
        reporter.setContextIdResolver(() => context)
        reporter.onRunnerStart(RUNNER)
        return reporter
    }
    const startTest = (reporter: HtmlReporter, uid: string, contextId: string) =>
        reporter.emit('test:start', { type: 'test:start', title: uid, fullTitle: uid, uid, cid: '0-0', parent: '', contextId })
    const eventsOf = (reporter: HtmlReporter, uid: string) =>
        (reporter.getTest(uid) as unknown as { events: { type: string, value: unknown }[] }).events
    const screenshot = (contextId: string) => ({
        command: 'takeScreenshot', endpoint: '/session/:sessionId/screenshot', sessionId: 's', contextId,
        result: { value: Buffer.from('png').toString('base64') }
    })
    afterEach(() => {
        context = undefined
        vi.useRealTimers()
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
    })

    it('adds the logs and the videos of a test to the test of its context', () => {
        const reporter = start()
        startTest(reporter, 'a', 'context-a')
        startTest(reporter, 'b', 'context-b')
        context = 'context-a'
        new ReportEvents().logMessage('log of a')
        reporter.emit('test:end', { uid: 'a', contextId: 'context-a' })
        // the video reporter sends the video after the end of the test
        new ReportEvents().videoCapture('a.webm')
        expect(eventsOf(reporter, 'a')).toEqual([{ type: 'log', value: 'log of a' }, { type: 'video-capture', value: 'a.webm' }])
        expect(eventsOf(reporter, 'b')).toEqual([])
    })

    it('adds the screenshot of a command to the test of the command context', () => {
        const reporter = start({ useOnAfterCommandForScreenshot: true })
        startTest(reporter, 'a', 'context-a')
        startTest(reporter, 'b', 'context-b')
        reporter.onAfterCommand(screenshot('context-a') as never)
        expect(eventsOf(reporter, 'a')).toHaveLength(1)
        expect(eventsOf(reporter, 'b')).toEqual([])
    })

    it('adds the events of a before hook to the first test of its context', () => {
        const reporter = start()
        startTest(reporter, 'a', 'context-a')
        context = 'context-b'
        new ReportEvents().logMessage('before hook of b')
        startTest(reporter, 'b', 'context-b')
        expect(eventsOf(reporter, 'a')).toEqual([])
        expect(eventsOf(reporter, 'b')).toEqual([{ type: 'log', value: 'before hook of b' }])
    })

    it('adds the events of a before hook to the test that it skips', () => {
        const reporter = start()
        startTest(reporter, 'a', 'context-a')
        context = 'context-b'
        // `this.skip()` in the before hook: the test ends as pending and never starts
        new ReportEvents().logMessage('before hook of b')
        reporter.emit('test:pending', { type: 'test:pending', title: 'b', fullTitle: 'b', uid: 'b', cid: '0-0', parent: '', contextId: 'context-b' })
        new ReportEvents().logMessage('after hook of b')
        expect(eventsOf(reporter, 'a')).toEqual([])
        expect(eventsOf(reporter, 'b')).toEqual([{ type: 'log', value: 'before hook of b' }, { type: 'log', value: 'after hook of b' }])
    })

    it('adds an event from before the first test with no context (the config before hook) to the first test', () => {
        const reporter = start()
        reporter.emit('suite:start', { type: 'suite:start', uid: 'A', title: 'A', fullTitle: 'A', cid: '0-0', parent: '', file: 'spec.js' })
        new ReportEvents().logMessage('config before')
        startTest(reporter, 'a', 'context-a')
        startTest(reporter, 'b', 'context-b')
        expect(eventsOf(reporter, 'a')).toEqual([{ type: 'log', value: 'config before' }])
        expect(eventsOf(reporter, 'b')).toEqual([])
    })

    it('keeps an event from before the first test for the first test that starts, not for a skipped test', () => {
        const reporter = start()
        const suite = (uid: string) => reporter.emit('suite:start', { type: 'suite:start', uid, title: uid, fullTitle: uid, cid: '0-0', parent: '', file: 'spec.js' })
        const pending = (uid: string, contextId: string) => reporter.emit('test:pending', { type: 'test:pending', title: uid, fullTitle: uid, uid, cid: '0-0', parent: '', contextId })
        suite('A')
        new ReportEvents().logMessage('config before')
        // `it.skip`: a pending test with a context, which never starts
        pending('s0', 'context-s0')
        startTest(reporter, 'a', 'context-a')
        expect(eventsOf(reporter, 's0')).toEqual([])
        expect(eventsOf(reporter, 'a')).toEqual([{ type: 'log', value: 'config before' }])
    })

    it('keeps an event from before the first test across a suite that its before hook skips', () => {
        const reporter = start()
        const suite = (uid: string) => reporter.emit('suite:start', { type: 'suite:start', uid, title: uid, fullTitle: uid, cid: '0-0', parent: '', file: 'spec.js' })
        new ReportEvents().logMessage('config before')
        suite('B')
        // `this.skip()` in the before hook of B
        reporter.emit('test:pending', { type: 'test:pending', title: 'b0', fullTitle: 'b0', uid: 'b0', cid: '0-0', parent: 'B', contextId: 'context-b0' })
        reporter.emit('suite:end', { type: 'suite:end', uid: 'B', title: 'B', fullTitle: 'B', cid: '0-0', file: 'spec.js' })
        suite('C')
        startTest(reporter, 'c1', 'context-c1')
        expect(eventsOf(reporter, 'b0')).toEqual([])
        expect(eventsOf(reporter, 'c1')).toEqual([{ type: 'log', value: 'config before' }])
    })

    it('warns one time for events with no test context while parallel tests run', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            const reporter = start()
            startTest(reporter, 'a', 'context-a')
            startTest(reporter, 'b', 'context-b')
            // a `browser.on()` callback runs outside the context of its test
            new ReportEvents().logMessage('from a callback')
            new ReportEvents().logMessage('from a callback again')
            expect(eventsOf(reporter, 'b')).toHaveLength(2)
            const warnings = warn.mock.calls.filter(([message]) => String(message).startsWith('[@wdio/html-reporter] An event with no parallel-mode test context'))
            expect(warnings).toHaveLength(1)
        } finally {
            warn.mockRestore()
        }
    })

    it('adds the events of a Before hook of a Cucumber retry to the first step of the retry', () => {
        const reporter = start()
        const scenario = { type: 'suite:start', title: 's', fullTitle: 's', uid: 's', cid: '0-0', parent: '', contextId: 'context-a' }
        reporter.emit('suite:start', scenario)
        startTest(reporter, 'step', 'context-a')
        reporter.emit('test:fail', { uid: 'step', contextId: 'context-a', error: { message: 'first try' } })
        reporter.emit('test:end', { uid: 'step', contextId: 'context-a' })
        reporter.emit('suite:retry', { ...scenario, type: 'suite:retry' })
        context = 'context-a'
        new ReportEvents().logMessage('Before hook of the retry')
        startTest(reporter, 'step', 'context-a')
        expect(eventsOf(reporter, 'step')).toEqual([{ type: 'log', value: 'Before hook of the retry' }])
    })

    it('gives 2 screenshots of the same millisecond 2 files', () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-22T10:00:00.000Z'))
        const reporter = start({ useOnAfterCommandForScreenshot: true })
        startTest(reporter, 'a', 'context-a')
        startTest(reporter, 'b', 'context-b')
        reporter.onAfterCommand(screenshot('context-a') as never)
        reporter.onAfterCommand(screenshot('context-b') as never)
        const [fileA] = eventsOf(reporter, 'a').map((event) => event.value)
        const [fileB] = eventsOf(reporter, 'b').map((event) => event.value)
        expect(fileA).not.toBe(fileB)
        expect(fs.existsSync(fileA as string) && fs.existsSync(fileB as string)).toBe(true)
    })
})

describe('sequential mode: events of a before hook', () => {
    const dir = path.join(outputRoot, 'sequential-hooks') + path.sep
    const start = () => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: dir, filename: 'report.html' } as never)
        reporter.onRunnerStart(RUNNER)
        return reporter
    }
    const log = (text: string) => new ReportEvents().logMessage(text)
    const suite = (reporter: HtmlReporter, uid: string, parent = '') =>
        reporter.emit('suite:start', { type: 'suite:start', uid, title: uid, fullTitle: uid, cid: '0-0', parent, file: 'spec.js' })
    const endSuite = (reporter: HtmlReporter, uid: string) =>
        reporter.emit('suite:end', { type: 'suite:end', uid, title: uid, fullTitle: uid, cid: '0-0', file: 'spec.js' })
    const hook = (reporter: HtmlReporter, title: string, parent: string, body: () => void) => {
        const payload = { uid: `${parent} ${title}`, title, parent, cid: '0-0' }
        reporter.emit('hook:start', payload)
        body()
        reporter.emit('hook:end', payload)
    }
    const test = (uid: string, parent: string) => ({ type: 'test:start', uid, title: uid, fullTitle: uid, cid: '0-0', parent })
    const runTest = (reporter: HtmlReporter, uid: string, parent: string, body: () => void = () => {}) => {
        reporter.emit('test:start', test(uid, parent))
        body()
        reporter.emit('test:pass', test(uid, parent))
        reporter.emit('test:end', test(uid, parent))
    }
    const logsOf = (reporter: HtmlReporter, uid: string) =>
        (reporter.getTest(uid) as unknown as { events: { type: string, value: unknown }[] }).events.map((event) => event.value)
    afterEach(() => {
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
    })

    it('adds the log of a before all hook to the first test of its suite, not to the test before (Mocha, Jasmine)', () => {
        const reporter = start()
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        runTest(reporter, 'A1', 'A', () => log('A1'))
        // an afterEach log comes after the end of its test
        hook(reporter, '"after each" hook for A', 'A', () => log('after each of A1'))
        suite(reporter, 'A nested', 'A')
        hook(reporter, '"before all" hook for A nested', 'A nested', () => log('before all of A nested'))
        runTest(reporter, 'AN1', 'A nested', () => log('AN1'))
        expect(logsOf(reporter, 'A1')).toEqual(['before all of A', 'A1', 'after each of A1'])
        expect(logsOf(reporter, 'AN1')).toEqual(['before all of A nested', 'AN1'])
    })

    it('adds the log of a Before hook to the first step of its scenario, not to the scenario before (Cucumber)', () => {
        const reporter = start()
        suite(reporter, 'feature')
        log('BeforeAll')
        suite(reporter, 'S1', 'feature')
        hook(reporter, '', 'S1', () => log('Before of S1'))
        runTest(reporter, 'S1 step 1', 'S1', () => log('S1 step 1'))
        runTest(reporter, 'S1 step 2', 'S1')
        hook(reporter, '', 'S1', () => log('After of S1'))
        endSuite(reporter, 'S1')
        suite(reporter, 'S2', 'feature')
        hook(reporter, '', 'S2', () => log('Before of S2'))
        runTest(reporter, 'S2 step 1', 'S2')
        expect(logsOf(reporter, 'S1 step 1')).toEqual(['BeforeAll', 'Before of S1', 'S1 step 1'])
        expect(logsOf(reporter, 'S1 step 2')).toEqual(['After of S1'])
        expect(logsOf(reporter, 'S2 step 1')).toEqual(['Before of S2'])
    })

    it('adds the log of a before all hook to the first test that runs, not to a skipped test before it', () => {
        const reporter = start()
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        // `it.skip`: the test ends as pending and never starts
        reporter.emit('test:pending', { ...test('A1', 'A'), type: 'test:pending' })
        runTest(reporter, 'A2', 'A')
        expect(logsOf(reporter, 'A1')).toEqual([])
        expect(logsOf(reporter, 'A2')).toEqual(['before all of A'])
    })

    it('adds the log of a before all hook to the first test that it skips (`this.skip()`)', () => {
        const reporter = start()
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        reporter.emit('test:pending', { ...test('A1', 'A'), type: 'test:pending' })
        reporter.emit('test:pending', { ...test('A2', 'A'), type: 'test:pending' })
        endSuite(reporter, 'A')
        expect(logsOf(reporter, 'A1')).toEqual(['before all of A'])
        expect(logsOf(reporter, 'A2')).toEqual([])
    })

    it('adds the log of the Before hook of a Cucumber retry to the first step of the retry', () => {
        const reporter = start()
        suite(reporter, 'S1')
        runTest(reporter, 'S1 step 1', 'S1')
        // the retry clears the steps of the first try
        reporter.emit('suite:retry', { type: 'suite:retry', uid: 'S1', title: 'S1', fullTitle: 'S1', cid: '0-0', parent: '', file: 'spec.js' })
        hook(reporter, '', 'S1', () => log('Before of the retry'))
        runTest(reporter, 'S1 step 1 retry', 'S1')
        expect(logsOf(reporter, 'S1 step 1 retry')).toEqual(['Before of the retry'])
    })

    it('does not give the log of a first suite with no test to the next suite', () => {
        const reporter = start()
        // `failHookAffectedTests: false`: the before all hook fails and no test of A is reported
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        endSuite(reporter, 'A')
        suite(reporter, 'B')
        hook(reporter, '"before all" hook for B', 'B', () => log('before all of B'))
        reporter.emit('test:pending', { ...test('B1', 'B'), type: 'test:pending' })
        endSuite(reporter, 'B')
        expect(logsOf(reporter, 'B1')).toEqual(['before all of B'])
    })

    it('adds the log of a before all hook that skips its suite to the first skipped test, not to a nested test', () => {
        const reporter = start()
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        // `this.skip()`: the tests of A and of its nested suite end as pending
        reporter.emit('test:pending', { ...test('A1', 'A'), type: 'test:pending' })
        suite(reporter, 'B', 'A')
        reporter.emit('test:pending', { ...test('B1', 'B'), type: 'test:pending' })
        endSuite(reporter, 'B')
        endSuite(reporter, 'A')
        expect(logsOf(reporter, 'A1')).toEqual(['before all of A'])
        expect(logsOf(reporter, 'B1')).toEqual([])
    })

    it('keeps the log of a before all hook for the first test of the suite after a nested suite with no test', () => {
        const reporter = start()
        suite(reporter, 'P')
        runTest(reporter, 'P1', 'P')
        endSuite(reporter, 'P')
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        // `failHookAffectedTests: false`: the before all hook of B fails and no test of B is reported
        suite(reporter, 'B', 'A')
        endSuite(reporter, 'B')
        suite(reporter, 'C', 'A')
        runTest(reporter, 'C1', 'C')
        expect(logsOf(reporter, 'P1')).toEqual([])
        expect(logsOf(reporter, 'C1')).toEqual(['before all of A'])
    })

    it('keeps the log of a nested before hook that skips its suite with that suite, and the parent log for the next test', () => {
        const reporter = start()
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        suite(reporter, 'B', 'A')
        hook(reporter, '"before all" hook for B', 'B', () => log('before all of B'))
        // `this.skip()` in the before all hook of B
        reporter.emit('test:pending', { ...test('B1', 'B'), type: 'test:pending' })
        endSuite(reporter, 'B')
        suite(reporter, 'C', 'A')
        runTest(reporter, 'C1', 'C')
        expect(logsOf(reporter, 'B1')).toEqual(['before all of B'])
        expect(logsOf(reporter, 'C1')).toEqual(['before all of A'])
    })

    it('adds the logs of the before all hooks of all parent suites to the first test, the outer one first', () => {
        const reporter = start()
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        suite(reporter, 'B', 'A')
        hook(reporter, '"before all" hook for B', 'B', () => log('before all of B'))
        suite(reporter, 'C', 'B')
        runTest(reporter, 'C1', 'C', () => log('C1'))
        expect(logsOf(reporter, 'C1')).toEqual(['before all of A', 'before all of B', 'C1'])
    })

    it('adds a log from before the first suite (a root hook) to the first test', () => {
        const reporter = start()
        log('root before all')
        suite(reporter, 'A')
        runTest(reporter, 'A1', 'A')
        expect(logsOf(reporter, 'A1')).toEqual(['root before all'])
    })

    it('gives the log of a nested suite with no test to the test before, not to a test of the next suite', () => {
        const reporter = start()
        suite(reporter, 'P')
        runTest(reporter, 'P1', 'P')
        endSuite(reporter, 'P')
        suite(reporter, 'A')
        // `failHookAffectedTests: false`: the before all hook of B fails and no test of B is reported
        suite(reporter, 'B', 'A')
        hook(reporter, '"before all" hook for B', 'B', () => log('before all of B'))
        endSuite(reporter, 'B')
        suite(reporter, 'C', 'A')
        runTest(reporter, 'C1', 'C')
        expect(logsOf(reporter, 'P1')).toEqual(['before all of B'])
        expect(logsOf(reporter, 'C1')).toEqual([])
    })

    it('does not give the Before log of a Cucumber scenario with no step to the next scenario', () => {
        const reporter = start()
        suite(reporter, 'feature')
        suite(reporter, 'S1', 'feature')
        hook(reporter, '', 'S1', () => log('Before of S1'))
        endSuite(reporter, 'S1')
        suite(reporter, 'S2', 'feature')
        runTest(reporter, 'S2 step 1', 'S2')
        expect(logsOf(reporter, 'S2 step 1')).toEqual([])
    })

    it('adds the log of a before all hook that skips only nested tests to the first nested test', () => {
        const reporter = start()
        suite(reporter, 'P')
        runTest(reporter, 'P1', 'P')
        endSuite(reporter, 'P')
        suite(reporter, 'A')
        // `this.skip()` in the before all hook of A, whose only tests are in B
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        suite(reporter, 'B', 'A')
        reporter.emit('test:pending', { ...test('B1', 'B'), type: 'test:pending' })
        endSuite(reporter, 'B')
        endSuite(reporter, 'A')
        expect(logsOf(reporter, 'P1')).toEqual([])
        expect(logsOf(reporter, 'B1')).toEqual(['before all of A'])
    })

    it('adds the logs of a parent and a nested before hook to the skipped nested test, the outer one first', () => {
        const reporter = start()
        suite(reporter, 'A')
        hook(reporter, '"before all" hook for A', 'A', () => log('before all of A'))
        suite(reporter, 'B', 'A')
        hook(reporter, '"before all" hook for B', 'B', () => log('before all of B'))
        reporter.emit('test:pending', { ...test('B1', 'B'), type: 'test:pending' })
        endSuite(reporter, 'B')
        endSuite(reporter, 'A')
        expect(logsOf(reporter, 'B1')).toEqual(['before all of A', 'before all of B'])
    })

    it('takes the suite of a before all hook from the hook owner of the base reporter (hookKind, hookSuiteUid)', () => {
        const reporter = start()
        const kindHook = (uid: string, parent: string, body: () => void) => {
            const payload = { uid, title: `"before all" hook for ${parent}`, parent, cid: '0-0', hookKind: 'beforeAll', hookSuiteUid: parent }
            reporter.emit('hook:start', payload)
            body()
            reporter.emit('hook:end', payload)
        }
        suite(reporter, 'A')
        kindHook('hA', 'A', () => log('before all of A'))
        suite(reporter, 'B', 'A')
        kindHook('hB', 'B', () => log('before all of B'))
        runTest(reporter, 'B1', 'B')
        expect(logsOf(reporter, 'B1')).toEqual(['before all of A', 'before all of B'])
    })

    it('adds the log of a suite with no test to the test before, as before', () => {
        const reporter = start()
        suite(reporter, 'A')
        runTest(reporter, 'A1', 'A')
        endSuite(reporter, 'A')
        // a before all hook fails with `failHookAffectedTests: false`: no test of B is reported
        suite(reporter, 'B')
        hook(reporter, '"before all" hook for B', 'B', () => log('before all of B'))
        endSuite(reporter, 'B')
        expect(logsOf(reporter, 'A1')).toEqual(['before all of B'])
    })
})
