import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { ReportAggregator } from '../src/index.js'

describe('ReportAggregator', () => {
    const dirs: string[] = []
    const tempDir = () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-reporter-aggregator-'))
        dirs.push(dir)
        return dir
    }
    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('reads only the files that end with .json', () => {
        const dir = tempDir()
        fs.writeFileSync(path.join(dir, 'report-0-0.json'), '{}')
        // `indexOf` gives -1 for these names, and -1 is also `length - 5` for a name of 4 characters
        fs.writeFileSync(path.join(dir, 'a.md'), 'text')
        fs.writeFileSync(path.join(dir, 'logs'), 'text')
        fs.writeFileSync(path.join(dir, 'report.json.bak'), '{}')
        const files = new ReportAggregator({ outputDir: dir, filename: 'master-report.html' }).readJsonFiles()
        expect(files.map((file) => path.basename(file))).toEqual(['report-0-0.json'])
    })

    it('makes the report of a run with no worker results when the folder does not exist', async () => {
        const dir = path.join(tempDir(), 'not-created')
        const reportAggregator = new ReportAggregator({ outputDir: dir, filename: 'master-report.html', reportTitle: 'No results' })
        await expect(reportAggregator.createReport()).resolves.toBeUndefined()
        const html = fs.readFileSync(path.join(dir, 'master-report.html'), 'utf-8')
        expect(html).toContain('No results')
        // the report says why it is empty
        expect(html).toContain('The execution of the test suite has failed before report generation was started')
        expect(html).not.toContain('<h3 class="warning"></h3>')
        expect(fs.existsSync(path.join(dir, 'master-report.json'))).toBe(true)
    })

    it('names the worker files from the file name only, also with no .html or a folder with .html', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        for (const [outputDir, filename, expected] of [
            [path.join(tempDir(), 'out'), 'report', 'report-0-0.json'],
            [path.join(tempDir(), 'site.html', 'out'), 'report.html', 'report-0-0.json']
        ]) {
            const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename, reportTitle: 'Names' } as never)
            reporter.onRunnerStart(RUNNER)
            reporter.onSuiteStart(SUITES[0])
            reporter.onSuiteEnd(SUITES[0])
            await reporter.onRunnerEnd(RUNNER)
            expect(fs.readdirSync(outputDir).filter((file) => file.endsWith('.json'))).toEqual([expected])
        }
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
    })

    it('makeReport gives exit code 1 when it cannot make the report', async () => {
        const { runCli } = await import('../src/makeReportCli.js')
        const file = path.join(tempDir(), 'a-file')
        fs.writeFileSync(file, 'not a folder')
        expect(await runCli(['master-report.html', file, 'Title'], { CI: 'true' })).toBe(1)
    })

    it('makeReport gives exit code 1 for a folder that does not exist, and does not create it', async () => {
        const { runCli } = await import('../src/makeReportCli.js')
        const typo = path.join(tempDir(), 'reprots')
        expect(await runCli(['master-report.html', typo, 'Title'], { CI: 'true' })).toBe(1)
        expect(fs.existsSync(typo)).toBe(false)
    })

    it('makeReport gives exit code 1 when only an old report is there', async () => {
        const { runCli } = await import('../src/makeReportCli.js')
        const dir = tempDir()
        const old = path.join(dir, 'master-report.html')
        fs.writeFileSync(old, 'old report')
        fs.utimesSync(old, new Date(2020, 0, 1), new Date(2020, 0, 1))
        // the HTML step fails: the aggregator logs the error and does not throw it
        const { default: HtmlGenerator } = await import('../src/htmlGenerator.js')
        const htmlOutput = vi.spyOn(HtmlGenerator, 'htmlOutput').mockRejectedValue(new Error('render failed'))
        try {
            expect(await runCli(['master-report.html', dir, 'Title'], { CI: 'true' })).toBe(1)
        } finally {
            htmlOutput.mockRestore()
        }
    })

    it('writes no cloud credentials into the JSON files', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const runner = Object.assign(Object.create(Object.getPrototypeOf(RUNNER)), RUNNER, {
            config: { ...RUNNER.config, user: 'cloud-user', key: 'cloud-access-key' },
            instanceOptions: { 'session-1': { user: 'cloud-user', key: 'cloud-access-key' } },
            // @wdio/reporter makes it from the capabilities, with the query of `appium:app`
            sanitizedCapabilities: 'pixel_7.14.app_apk?token=cloud-access-key',
            capabilities: {
                ...RUNNER.capabilities,
                'bstack:options': { userName: 'cloud-user', accessKey: 'cloud-access-key' },
                // secrets under names with no secret word, or in objects, arrays and URLs
                'x:options': { credentials: { user: 'cloud-user', pass: 'cloud-access-key' }, apiKeys: ['cloud-access-key'] },
                'appium:app': 'https://cloud-user:cloud-access-key@example.com/app.apk'
            }
        })
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Secrets' } as never)
        reporter.onRunnerStart(runner)
        reporter.onSuiteStart(SUITES[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(runner)
        const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Secrets' })
        await reportAggregator.createReport()
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')

        for (const file of fs.readdirSync(outputDir).filter((name) => name.endsWith('.json') || name.endsWith('.html'))) {
            expect(fs.readFileSync(path.join(outputDir, file), 'utf-8'), file).not.toContain('cloud-access-key')
        }
        // the report still has what it uses
        const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf-8'))
        expect(json.info).toMatchObject({ cid: '0-0', start: RUNNER.start.toISOString?.() ?? RUNNER.start })
        expect(json.info.capabilities.browserName).toBe('chrome')
    })

    it('removes its process listeners when the runner ends', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const events = ['test:log', 'test:screenshot', 'test:video-capture'] as const
        const before = events.map((event) => process.listenerCount(event))
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir: path.join(tempDir(), 'out'), filename: 'report.html', reportTitle: 'Listeners' } as never)
        expect(events.map((event) => process.listenerCount(event))).toEqual(before.map((count) => count + 1))
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        expect(events.map((event) => process.listenerCount(event))).toEqual(before)
    })

    it('ReportGenerator writes the worker JSON with its default options', async () => {
        const { ReportGenerator } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const { ReportData, Metrics } = await import('../src/types.js')
        const outputDir = tempDir()
        const generator = new ReportGenerator({ outputDir })
        await generator.createReport(new ReportData('Generator', RUNNER, [SUITES[0]], new Metrics(), path.join(outputDir, 'x.html'), 'chrome'))
        // the file of the report data, with the cid of the worker
        expect(fs.readdirSync(outputDir).filter((file) => file.endsWith('.json'))).toEqual(['x-0-0.json'])
        // the path of the report of the worker, with the cid
        expect(generator.reportFile).toBe(path.join(outputDir, 'x-0-0.html'))
    })

    it('does not read a master report of another name as a worker report', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Masters' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onTestStart(SUITES[0].tests[0])
        reporter.onTestPass(SUITES[0].tests[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        // the onComplete hook makes a master report, then the command line another one
        await new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Masters' }).createReport()
        await new ReportAggregator({ outputDir, filename: 'from-cli.html', reportTitle: 'Masters' }).createReport()
        const metrics = JSON.parse(fs.readFileSync(path.join(outputDir, 'from-cli.json'), 'utf-8')).metrics
        expect(metrics.passed).toBe(1)
    })

    it('writes each test one time in the worker JSON (no hooksAndTests copy)', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Size' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart({ ...SUITES[0], hooksAndTests: SUITES[0].tests } as never)
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        expect(fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf-8')).not.toContain('hooksAndTests')
    })
})
