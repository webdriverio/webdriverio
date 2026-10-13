import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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

    it('counts the steps as tests with scenarioLevelReporter', () => {
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: cucumberOutputDir } as never)
        reporter.onRunnerStart({ cid: '0-0', config: { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter: true } } } as never)
        reporter.onTestPass({ uid: 'scenario-as-test', state: 'passed' } as never)
        expect(reporter.metrics).toMatchObject({ passed: 1, failed: 0 })
    })
})

describe('links in log messages', () => {
    const linksOutputDir = path.join(outputRoot, 'links') + path.sep
    const message = "see https://webdriver.io/docs?a=1&b=2 and <b>bold</b> and https://example.com/O'Reilly"

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
})
