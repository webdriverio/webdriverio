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

describe('code review points', () => {
    const dirs: string[] = []
    const tempDir = (name: string) => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `html-reporter-${name}-`)) + path.sep
        dirs.push(dir)
        return dir
    }
    const common = { cid: '0-0', specs: [], file: 'spec.js' }
    const suite = (uid: string) => ({ ...common, type: 'suite:start', uid, title: uid, fullTitle: uid, parent: '' })
    const test = (uid: string, contextId?: string) => ({ ...common, type: 'test:start', uid, title: uid, fullTitle: uid, parent: 'suite', ...(contextId ? { contextId } : {}) })

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
