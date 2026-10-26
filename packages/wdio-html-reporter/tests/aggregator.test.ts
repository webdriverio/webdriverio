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

    it('makeReport gives exit code 1 for a folder with no worker results (artifacts not downloaded)', async () => {
        const { runCli } = await import('../src/makeReportCli.js')
        const dir = tempDir()
        expect(await runCli(['master-report.html', dir, 'Title'], { CI: 'true' })).toBe(1)
        // the report still says why it is empty
        expect(fs.readFileSync(path.join(dir, 'master-report.html'), 'utf-8'))
            .toContain('The execution of the test suite has failed before report generation was started')
        // only files that are not worker results: another tool, a master report of another name
        fs.mkdirSync(path.join(dir, 'allure-results'))
        fs.writeFileSync(path.join(dir, 'allure-results', 'abc-result.json'), '{"name":"a test"}')
        fs.writeFileSync(path.join(dir, 'other-master.json'), '{"master":true}')
        expect(await runCli(['master-report.html', dir, 'Title'], { CI: 'true' })).toBe(1)
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

    it('makeReport gives exit code 1 when a suite of the report fails to render', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { runCli } = await import('../src/makeReportCli.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Render' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        const { default: nunjucks } = await import('nunjucks')
        const render = nunjucks.render.bind(nunjucks)
        const spy = vi.spyOn(nunjucks, 'render').mockImplementation(((name: string, context: object, callback?: (err: Error | null, result?: string) => void) => {
            if (name === 'suite.html' && callback) {
                callback(new Error('suite render failed'))
                return undefined as never
            }
            return render(name, context, callback as never)
        }) as never)
        try {
            expect(await runCli(['master-report.html', outputDir, 'Title'], { CI: 'true' })).toBe(1)
        } finally {
            spy.mockRestore()
        }
    })

    it('makeReport gives exit code 1 when a worker file cannot be read, not for another JSON file', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { runCli } = await import('../src/makeReportCli.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Inputs' } as never)
        reporter.onRunnerStart(RUNNER)
        reporter.onSuiteStart(SUITES[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(RUNNER)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        // a JSON file of another tool below outputDir (for example Allure results) is not a report
        fs.mkdirSync(path.join(outputDir, 'allure-results'))
        fs.writeFileSync(path.join(outputDir, 'allure-results', 'abc-result.json'), '{"name":"a test"}')
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        try {
            expect(await runCli(['master-report.html', outputDir, 'Title'], { CI: 'true' })).toBe(0)
            // skipped without a TypeError stack
            expect(error).not.toHaveBeenCalled()
            // a worker that stopped while it wrote its file
            fs.writeFileSync(path.join(outputDir, 'report-0-1.json'), '{"info":{"specs":["a.js"]')
            expect(await runCli(['master-report.html', outputDir, 'Title'], { CI: 'true' })).toBe(1)
        } finally {
            error.mockRestore()
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

    it('keeps the device of an Appium session, which returns the capabilities without the appium: prefix', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        // the capabilities that Appium 3 (XCUITest) returns for a session
        const runner = Object.assign(Object.create(Object.getPrototypeOf(RUNNER)), RUNNER, {
            capabilities: { platformName: 'iOS', browserName: 'Safari', deviceName: 'iPhone 17', platformVersion: '26.3', automationName: 'XCUITest', udid: 'abc' }
        })
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Device' } as never)
        reporter.onRunnerStart(runner)
        reporter.onSuiteStart(SUITES[0])
        reporter.onSuiteEnd(SUITES[0])
        await reporter.onRunnerEnd(runner)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf-8'))
        expect(json.info.capabilities).toEqual({ platformName: 'iOS', browserName: 'Safari', deviceName: 'iPhone 17', platformVersion: '26.3', automationName: 'XCUITest' })
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

    it('reports a worker whose session did not start', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'No session' } as never)
        const runner = { ...RUNNER, cid: '0-2', specs: ['file:///project/login.spec.js'] } as never
        reporter.onRunnerStart(runner)
        // the runner gives the error of the session start in runner:end
        await reporter.onRunnerEnd({ ...(runner as object), failures: 1, error: 'connect ECONNREFUSED 127.0.0.1:9' } as never)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
        const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'No session' })
        await reportAggregator.createReport()
        expect(reportAggregator.failed).toBe(true)
        const html = fs.readFileSync(reportAggregator.reportFile, 'utf-8')
        expect(html).toContain('0-2 (login.spec.js) could not start its session')
        // the error text can have a host name with credentials: it stays in the logs
        expect(fs.readFileSync(path.join(outputDir, 'report-0-2.json'), 'utf-8')).not.toContain('ECONNREFUSED')
    })

    it('reports a worker that stopped before it wrote its results', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { runCli } = await import('../src/makeReportCli.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const finished = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Stopped' } as never)
        finished.onRunnerStart(RUNNER)
        finished.onSuiteStart(SUITES[0])
        finished.onTestStart(SUITES[0].tests[0])
        finished.onTestPass(SUITES[0].tests[0])
        finished.onSuiteEnd(SUITES[0])
        await finished.onRunnerEnd(RUNNER)
        expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf-8')).incomplete).toBeUndefined()
        // a worker that is killed during its tests: no runner end
        const stopped = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Stopped' } as never)
        stopped.onRunnerStart({ ...RUNNER, cid: '0-1', specs: ['file:///project/killed.spec.js'] } as never)
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')

        const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Stopped' })
        await reportAggregator.createReport()
        expect(reportAggregator.failed).toBe(true)
        const master = JSON.parse(fs.readFileSync(path.join(outputDir, 'master-report.json'), 'utf-8'))
        expect(master.metrics.passed).toBe(1)
        expect(master.message).toContain('0-1 (killed.spec.js)')
        expect(fs.readFileSync(reportAggregator.reportFile, 'utf-8')).toContain('0-1 (killed.spec.js)')
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        try {
            expect(await runCli(['from-cli.html', outputDir, 'Stopped'], { CI: 'true' })).toBe(1)
        } finally {
            error.mockRestore()
        }
    })

    describe('browser of the report header', () => {
        const header = (file: string) => fs.readFileSync(file, 'utf-8').match(/<td>Browser<\/td>\s*<td>([^<]*)<\/td>/)?.[1]
        const runWorker = async (outputDir: string, runnerData: Record<string, unknown>, options: Record<string, unknown> = {}) => {
            const { HtmlReporter } = await import('../src/index.js')
            const { RUNNER, SUITES } = await import('./testdata.js')
            const runner = Object.assign(Object.create(Object.getPrototypeOf(RUNNER)), RUNNER, runnerData)
            const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename: 'report.html', reportTitle: 'Browser', produceHtml: true, ...options } as never)
            reporter.onRunnerStart(runner)
            reporter.onSuiteStart(SUITES[0])
            reporter.onSuiteEnd(SUITES[0])
            await reporter.onRunnerEnd(runner)
            process.removeAllListeners('test:log')
            process.removeAllListeners('test:screenshot')
            process.removeAllListeners('test:video-capture')
            return path.join(outputDir, `report-${runner.cid}.html`)
        }

        it('the report of a worker shows the browser of the session when no browserName is set', async () => {
            const outputDir = path.join(tempDir(), 'out')
            expect(header(await runWorker(outputDir, { cid: '0-0', capabilities: { browserName: 'chrome', browserVersion: '130' } }))).toBe('chrome')
            expect(header(await runWorker(outputDir, { cid: '0-1', capabilities: { platformName: 'iOS', deviceName: 'iPhone 17' } }))).toBe('iPhone 17 (iOS)')
            expect(header(await runWorker(outputDir, {
                cid: '0-2',
                isMultiRemote: true,
                capabilities: { myChrome: { browserName: 'chrome' }, myFirefox: { browserName: 'firefox' }, otherChrome: { browserName: 'chrome' } }
            }))).toBe('chrome, firefox')
        })

        it('the report of a worker shows the browserName option when it is set, and the default when no browser is known', async () => {
            const outputDir = path.join(tempDir(), 'out')
            expect(header(await runWorker(outputDir, { cid: '0-0', capabilities: { browserName: 'chrome' } }, { browserName: 'my browser' }))).toBe('my browser')
            expect(header(await runWorker(outputDir, { cid: '0-1', capabilities: { platformName: 'linux' } }))).toBe('not specified')
        })

        it('the master report shows the browsers of the worker reports when no browserName is set', async () => {
            const outputDir = path.join(tempDir(), 'out')
            await runWorker(outputDir, { cid: '0-0', capabilities: { browserName: 'chrome' } })
            await runWorker(outputDir, { cid: '1-0', capabilities: { browserName: 'firefox' } })
            await runWorker(outputDir, { cid: '0-1', capabilities: { browserName: 'chrome' } })
            const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Browser' })
            await reportAggregator.createReport()
            expect(header(reportAggregator.reportFile)).toBe('chrome, firefox')
            const configured = new ReportAggregator({ outputDir, filename: 'configured.html', reportTitle: 'Browser', browserName: 'my browser' })
            await configured.createReport()
            expect(header(configured.reportFile)).toBe('my browser')
        })

        it('the worker and the master report show the app, the device and the platform of a mobile session', async () => {
            const outputDir = path.join(tempDir(), 'out')
            const workerFile = await runWorker(outputDir, {
                cid: '0-0',
                capabilities: { platformName: 'iOS', deviceName: 'iPhone 17', platformVersion: '18.2', app: '/Users/me/MyApp.app' }
            })
            const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Browser' })
            await reportAggregator.createReport()
            expect(header(workerFile)).toBe('MyApp.app on iPhone 17 (iOS 18.2)')
            expect(header(reportAggregator.reportFile)).toBe('MyApp.app on iPhone 17 (iOS 18.2)')
            const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf-8'))
            expect(json.info.browserNames).toEqual(['MyApp.app on iPhone 17 (iOS 18.2)'])
        })

        it('the worker and the master header name a remote app by its file name, without the credentials and the token', async () => {
            const outputDir = path.join(tempDir(), 'out')
            const workerFile = await runWorker(outputDir, {
                cid: '0-0',
                capabilities: {
                    platformName: 'Android', 'appium:deviceName': 'Pixel 9', 'appium:platformVersion': '15',
                    'appium:app': 'https://user:secret@storage.example.com/builds/app.apk?token=abc123'
                }
            })
            const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Browser' })
            await reportAggregator.createReport()
            for (const file of [workerFile, reportAggregator.reportFile]) {
                expect(header(file)).toBe('app.apk on Pixel 9 (Android 15)')
                expect(fs.readFileSync(file, 'utf-8')).not.toMatch(/secret|token/)
            }
            const json = fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf-8')
            expect(JSON.parse(json).info.browserNames).toEqual(['app.apk on Pixel 9 (Android 15)'])
        })

        it('the master report falls back to the capabilities for a worker file with no browser names', async () => {
            const outputDir = path.join(tempDir(), 'out')
            await runWorker(outputDir, { cid: '0-0', capabilities: { browserName: 'chrome' } })
            const file = path.join(outputDir, 'report-0-0.json')
            const json = JSON.parse(fs.readFileSync(file, 'utf-8'))
            delete json.info.browserNames
            fs.writeFileSync(file, JSON.stringify(json))
            const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Browser' })
            await reportAggregator.createReport()
            expect(header(reportAggregator.reportFile)).toBe('chrome')
        })

        it('the master report from the command line shows not specified when no worker file names a browser', async () => {
            const { makeReport } = await import('../src/makeReportCli.js')
            const outputDir = path.join(tempDir(), 'out')
            await runWorker(outputDir, { cid: '0-0', capabilities: { platformName: 'linux' } })
            expect(header(await makeReport(['from-cli.html', outputDir, 'Title'], { CI: 'true' }))).toBe('not specified')
        })

        it('the master report from the command line shows TEST_BROWSER, else the browsers of the worker reports', async () => {
            const { makeReport } = await import('../src/makeReportCli.js')
            const outputDir = path.join(tempDir(), 'out')
            await runWorker(outputDir, { cid: '0-0', capabilities: { browserName: 'chrome' } })
            await runWorker(outputDir, { cid: '1-0', isMultiRemote: true, capabilities: { a: { browserName: 'firefox' }, b: { platformName: 'iOS', deviceName: 'iPhone 17' } } })
            expect(header(await makeReport(['from-cli.html', outputDir, 'Title'], { CI: 'true' }))).toBe('chrome, firefox, iPhone 17 (iOS)')
            expect(header(await makeReport(['from-env.html', outputDir, 'Title'], { CI: 'true', TEST_BROWSER: 'edge' }))).toBe('edge')
        })
    })

    const RUNNER_SPECS = ['/foo/bar/baz.js']
    /**
     * `specFileRetries: 1`: the retry runs in a new worker with the same cid. The runner gives the first
     * attempt `retry` 2 (`specFileRetries + 1`), the retry 1, and a run with no `specFileRetries` 1
     */
    const runAttempt = async (outputDir: string, retry: number, { passed = true, killed = false, specFileRetries = 1, start = '2021-06-11T16:24:27.910Z', filename = 'report.html', specs = RUNNER_SPECS } = {}) => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER } = await import('./testdata.js')
        const reporter = new HtmlReporter({ logFile: os.devNull, outputDir, filename, reportTitle: 'Retries' } as never)
        const runner = Object.assign(Object.create(Object.getPrototypeOf(RUNNER)), RUNNER, { retry, start, specs, config: { specFileRetries } })
        reporter.onRunnerStart(runner)
        if (!killed) {
            const common = { cid: '0-0', file: 'retried.spec.js' }
            const test = { ...common, type: 'test:start', uid: 'flaky', title: 'flaky', fullTitle: 'flaky', parent: 'retried' }
            reporter.emit('suite:start', { ...common, type: 'suite:start', uid: 'retried', title: 'retried', fullTitle: 'retried', parent: '' })
            reporter.emit('test:start', test)
            reporter.emit(passed ? 'test:pass' : 'test:fail', { ...test, ...(passed ? {} : { error: { message: 'fails' } }) })
            reporter.emit('test:end', test)
            reporter.emit('suite:end', { ...common, type: 'suite:end', uid: 'retried', title: 'retried', fullTitle: 'retried' })
            await reporter.onRunnerEnd(runner)
        }
        process.removeAllListeners('test:log')
        process.removeAllListeners('test:screenshot')
        process.removeAllListeners('test:video-capture')
    }
    const jsonFiles = (dir: string) => fs.readdirSync(dir).filter((file) => file.endsWith('.json')).sort()
    const masterOf = async (outputDir: string) => {
        const reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Retries' })
        await reportAggregator.createReport()
        return { failed: reportAggregator.failed, ...JSON.parse(fs.readFileSync(path.join(outputDir, 'master-report.json'), 'utf-8')) }
    }

    it('writes one worker file for each attempt of a spec file retry', async () => {
        const outputDir = path.join(tempDir(), 'out')
        await runAttempt(outputDir, 2, { passed: false })
        await runAttempt(outputDir, 1, { start: '2021-06-11T16:25:27.910Z' })
        expect(jsonFiles(outputDir)).toEqual(['report-0-0-retry1.json', 'report-0-0.json'])
        const single = path.join(tempDir(), 'out')
        await runAttempt(single, 1, { specFileRetries: 0 })
        expect(jsonFiles(single)).toEqual(['report-0-0.json'])
    })

    it('shows the retried attempt of a spec file, and counts only its last attempt', async () => {
        const outputDir = path.join(tempDir(), 'out')
        await runAttempt(outputDir, 2, { passed: false })
        await runAttempt(outputDir, 1, { start: '2021-06-11T16:25:27.910Z' })
        const master = await masterOf(outputDir)
        expect(master.metrics).toMatchObject({ passed: 1, failed: 0 })
        expect(master.suites.map((suite: { title: string }) => suite.title)).toEqual(['retried (spec file attempt 1, retried)', 'retried'])
    })

    it('does not report a killed attempt that a retry of the spec file replaced', async () => {
        const outputDir = path.join(tempDir(), 'out')
        await runAttempt(outputDir, 2, { killed: true })
        await runAttempt(outputDir, 1, { start: '2021-06-11T16:25:27.910Z' })
        const master = await masterOf(outputDir)
        expect(master.failed).toBe(false)
        expect(master.message).toBeUndefined()
        expect(master.metrics).toMatchObject({ passed: 1, failed: 0 })
    })

    it('counts the reports of 2 CI jobs in 2 folders, which both have the cid 0-0', async () => {
        const outputDir = path.join(tempDir(), 'out')
        await runAttempt(path.join(outputDir, 'job-1'), 1, { specFileRetries: 0 })
        await runAttempt(path.join(outputDir, 'job-2'), 1, { specFileRetries: 0, start: '2021-06-11T16:25:27.910Z' })
        const master = await masterOf(outputDir)
        expect(master.metrics).toMatchObject({ passed: 2, failed: 0 })
        expect(master.suites.map((suite: { title: string }) => suite.title)).toEqual(['retried', 'retried'])
    })

    it('counts the reports of 2 configurations with another file name in one folder, which both have the cid 0-0', async () => {
        const outputDir = path.join(tempDir(), 'out')
        await runAttempt(outputDir, 1, { specFileRetries: 0, filename: 'report-chrome.html', passed: false })
        await runAttempt(outputDir, 1, { specFileRetries: 0, filename: 'report-firefox.html', start: '2021-06-11T16:30:00.000Z' })
        const master = await masterOf(outputDir)
        expect(master.metrics).toMatchObject({ passed: 1, failed: 1 })
        expect(master.suites.map((suite: { title: string }) => suite.title)).toEqual(['retried', 'retried'])
    })

    it('labels each attempt with its own number when a killed attempt is not in the report', async () => {
        const outputDir = path.join(tempDir(), 'out')
        // specFileRetries: 2: the runner gives 3, then 1, then 2
        await runAttempt(outputDir, 3, { specFileRetries: 2, killed: true })
        await runAttempt(outputDir, 1, { specFileRetries: 2, passed: false, start: '2021-06-11T16:25:27.910Z' })
        await runAttempt(outputDir, 2, { specFileRetries: 2, start: '2021-06-11T16:26:27.910Z' })
        const master = await masterOf(outputDir)
        expect(master.metrics).toMatchObject({ passed: 1, failed: 0 })
        expect(master.suites.map((suite: { title: string }) => suite.title)).toEqual(['retried (spec file attempt 2, retried)', 'retried'])
    })

    it('leaves out an old retry file of another spec file in the same folder', async () => {
        const outputDir = path.join(tempDir(), 'out')
        await runAttempt(outputDir, 2, { passed: false, specs: ['/project/a.js'] })
        await runAttempt(outputDir, 1, { start: '2021-06-11T16:25:27.910Z', specs: ['/project/a.js'] })
        // a new run of another spec file with the same cid, and no clean of the folder
        await runAttempt(outputDir, 1, { specFileRetries: 0, start: '2021-06-12T10:00:00.000Z', specs: ['/project/b.js'] })
        const master = await masterOf(outputDir)
        expect(master.metrics).toMatchObject({ passed: 1, failed: 0 })
        expect(master.suites.map((suite: { title: string }) => suite.title)).toEqual(['retried'])
    })

    it('counts the new run, not the retry files of an earlier run in the same folder', async () => {
        const outputDir = path.join(tempDir(), 'out')
        await runAttempt(outputDir, 2, { passed: false })
        await runAttempt(outputDir, 1, { passed: false, start: '2021-06-11T16:25:27.910Z' })
        // a new run with no specFileRetries, and no clean of the folder
        await runAttempt(outputDir, 1, { specFileRetries: 0, start: '2021-06-12T10:00:00.000Z' })
        const master = await masterOf(outputDir)
        expect(master.metrics).toMatchObject({ passed: 1, failed: 0 })
        expect(master.suites.at(-1).title).toBe('retried')
    })
})
