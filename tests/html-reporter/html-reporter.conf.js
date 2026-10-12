import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { ReportAggregator } from '@wdio/html-reporter'
import { config as baseConfig } from '../helpers/config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * the reporter joins `process.cwd()` and `outputDir`, so `outputDir` is
 * relative to the smoke runner folder (`tests/`)
 */
export const outputDir = path.relative(process.cwd(), path.join(__dirname, 'out')) + path.sep

let reportAggregator

export const config = Object.assign({}, baseConfig, {
    specs: [path.join(__dirname, 'html-reporter.spec.js')],
    reporters: [['html', {
        outputDir,
        filename: 'report.html',
        reportTitle: 'Smoke Test Report',
        logFile: path.join(__dirname, 'out', 'html-reporter.log')
    }]],
    onPrepare () {
        fs.rmSync(path.join(__dirname, 'out'), { recursive: true, force: true })
        fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true })
        reportAggregator = new ReportAggregator({
            outputDir,
            filename: 'master-report.html',
            reportTitle: 'Smoke Master Report',
            browserName: 'chrome'
        })
        reportAggregator.clean()
    },
    async onComplete () {
        await reportAggregator.createReport()
    }
})
