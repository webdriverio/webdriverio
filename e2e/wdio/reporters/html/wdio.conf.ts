import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { ReportAggregator } from '@wdio/html-reporter'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const resultsDir = path.join(__dirname, 'results')
const htmlDir = path.join(resultsDir, 'html')
const reportTitle = 'HTML reporter e2e'

/**
 * Real-browser check of `@wdio/html-reporter` (not in CI, run it when you work on
 * the reporter): `pnpm run test:e2e:html-reporter`. `onComplete` creates the master
 * report and fails the run when it does not have the expected content.
 */
export const config: WebdriverIO.Config = {
    specs: [path.join(__dirname, 'html.e2e.ts')],
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }],
    logLevel: 'info',
    framework: 'mocha',
    outputDir: resultsDir,
    reporters: ['spec', ['html', { outputDir: htmlDir, filename: 'report.html', reportTitle }]],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    /**
     * the launcher already writes its log into `resultsDir`
     */
    onPrepare () {
        fs.rmSync(htmlDir, { recursive: true, force: true })
    },

    async onComplete () {
        const reportAggregator = new ReportAggregator({ outputDir: htmlDir, filename: 'master-report.html', reportTitle, browserName: 'chrome' })
        await reportAggregator.createReport()

        const errors: string[] = []
        const check = (ok: unknown, message: string) => {
            if (!ok) {
                errors.push(message)
            }
        }
        const html = fs.existsSync(reportAggregator.reportFile) ? fs.readFileSync(reportAggregator.reportFile, 'utf-8') : ''
        check(html, `no master report at ${reportAggregator.reportFile}`)
        check(html.includes(reportTitle), 'the report has no title')
        check(html.includes('logs a message and a screenshot') && html.includes('logs an object'), 'the report does not list the 2 tests')
        check(html.includes('Opened the guinea pig page'), 'the report has no log line')
        check(html.includes('{ title: &#39;WebdriverJS Testpage&#39; }'), 'the report does not show the logged object')
        check(/src="data:image\/png;base64,[A-Za-z0-9+/]{100}/.test(html), 'the report has no screenshot')
        check(fs.existsSync(path.join(htmlDir, 'report-styles.css')), 'the report has no CSS file')

        const masterJson = path.join(htmlDir, 'master-report.json')
        const master = fs.existsSync(masterJson) ? JSON.parse(fs.readFileSync(masterJson, 'utf-8')) : undefined
        const metrics = master?.metrics
        check(metrics?.passed === 3 && metrics?.failed === 0 && metrics?.skipped === 1, `metrics: ${JSON.stringify(metrics)}`)
        type ReportSuite = { tests: { title: string, events?: { type: string, value: unknown }[] }[], suites?: ReportSuite[] }
        const testsOf = (suite: ReportSuite): ReportSuite['tests'] => [...suite.tests, ...(suite.suites ?? []).flatMap(testsOf)]
        const logsOf = (title: string) => (master?.suites ?? [])
            .flatMap(testsOf)
            .find((test: { title: string }) => test.title === title)?.events?.filter((event: { type: string }) => event.type === 'log').map((event: { value: unknown }) => event.value)
        const hookTest = logsOf('runs after a before all hook')
        check(hookTest?.[0] === 'Before all of the hooks suite', `the before all log is not in the first test of its suite: ${JSON.stringify(hookTest)}`)
        const skippedTest = logsOf('is skipped by the before all hook of its parent')
        check(skippedTest?.[0] === 'Before all of the skipped suite', `the log of a before all hook that skips its suite is not in the skipped test: ${JSON.stringify(skippedTest)}`)

        if (errors.length) {
            console.error(`HTML reporter e2e check failed:\n  - ${errors.join('\n  - ')}`)
            throw new Error('HTML reporter e2e check failed')
        }
        console.log(`HTML reporter e2e check passed: ${reportAggregator.reportFile}`)
    }
}
