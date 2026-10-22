/* eslint-disable @typescript-eslint/no-require-imports -- a CommonJS file */
const fs = require('node:fs')
const path = require('node:path')
const { ReportAggregator } = require('@wdio/html-reporter')

/**
 * A CommonJS configuration that loads the reporter with `require()`
 */
const outputDir = path.relative(process.cwd(), path.join(__dirname, 'out-cjs')) + path.sep
let reportAggregator

exports.config = {
    capabilities: [{ browserName: 'chrome' }],
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'out-cjs'),
    services: ['webdriver-mock'],
    specs: [path.join(__dirname, 'html-reporter.cjs.spec.cjs')],
    reporters: [['html', { outputDir, filename: 'report.html', reportTitle: 'Smoke CJS Report' }]],
    onPrepare () {
        fs.rmSync(path.join(__dirname, 'out-cjs'), { recursive: true, force: true })
        reportAggregator = new ReportAggregator({ outputDir, filename: 'master-report.html', reportTitle: 'Smoke CJS Master Report' })
        reportAggregator.clean()
    },
    async onComplete () {
        await reportAggregator.createReport()
    }
}
