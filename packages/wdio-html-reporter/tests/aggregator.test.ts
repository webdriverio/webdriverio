import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

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
        expect(fs.readFileSync(path.join(dir, 'master-report.html'), 'utf-8')).toContain('No results')
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

    it('writes no cloud credentials into the JSON files', async () => {
        const { HtmlReporter } = await import('../src/index.js')
        const { RUNNER, SUITES } = await import('./testdata.js')
        const outputDir = path.join(tempDir(), 'out')
        const runner = Object.assign(Object.create(Object.getPrototypeOf(RUNNER)), RUNNER, {
            config: { ...RUNNER.config, user: 'cloud-user', key: 'cloud-access-key' },
            instanceOptions: { 'session-1': { user: 'cloud-user', key: 'cloud-access-key' } },
            capabilities: { ...RUNNER.capabilities, 'bstack:options': { userName: 'cloud-user', accessKey: 'cloud-access-key' } }
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
})
