import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { ReportAggregator } from '@wdio/html-reporter'
import { config as baseConfig } from '../helpers/config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * The configuration of an html reporter smoke test, with its own folder: the
 * smoke runner can run the Mocha and the Cucumber suites at the same time.
 * `outputDir` is relative to the smoke runner folder (`tests/`), because the
 * reporter joins `process.cwd()` and `outputDir`.
 * @param {string} folder  folder name in `tests/html-reporter/`
 */
export function htmlSmokeConfig (folder) {
    const outputDir = path.relative(process.cwd(), path.join(__dirname, folder)) + path.sep
    let reportAggregator
    return Object.assign({}, baseConfig, {
        specs: [path.join(__dirname, 'html-reporter.spec.js')],
        reporters: [['html', {
            outputDir,
            filename: 'report.html',
            reportTitle: 'Smoke Test Report',
            logFile: path.join(__dirname, folder, 'html-reporter.log')
        }]],
        onPrepare () {
            fs.rmSync(path.join(__dirname, folder), { recursive: true, force: true })
            fs.mkdirSync(path.join(__dirname, folder), { recursive: true })
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
}

export const config = htmlSmokeConfig('out')
