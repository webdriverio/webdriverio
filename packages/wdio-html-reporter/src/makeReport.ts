import { ReportAggregator } from './index.js'

(async () => {
    const args = process.argv.slice(2)
    const reportName = args[0] ? args[0] : 'master-report.html'
    try {
        const reportAggregator = new ReportAggregator(
            {
                outputDir: './reports/html-reports/',
                filename: reportName,
                reportTitle: 'Micro-Magic Web Test Report',
                browserName: process.env.TEST_BROWSER ? process.env.TEST_BROWSER : 'unspecified',
                showInBrowser: true,
            })
        await reportAggregator.createReport()
    } catch (ex)  {
        console.error(ex)
    }
})()
