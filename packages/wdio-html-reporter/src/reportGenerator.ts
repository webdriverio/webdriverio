import HtmlGenerator from './htmlGenerator.js'
import type { HtmlReporterOptions, ReportData } from './types.js'
import { Metrics } from './types.js'
import { String } from 'typescript-string-operations'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
dayjs.extend(utc)
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'
dayjs.extend(isSameOrBefore)
import type { SuiteStats } from '@wdio/reporter'
import path from 'node:path'
import logger from '@wdio/logger'
import JsonGenerator from './jsonGenerator.js'
const timeFormat ='YYYY-MM-DDTHH:mm:ss.SSS[Z]'

class ReportGenerator {
    private LOG = logger('ReportGenerator')
    constructor(opts: Partial<HtmlReporterOptions> = {}) {
        this.options = Object.assign({}, {
            outputDir: 'reports/html-reports/',
            filename: 'master-report.html',
            reportTitle: 'Test Master Report',
            showInBrowser: false,
            browserName: 'not specified',
            collapseTests: false,
            collapseSuites: false,
            LOG: null,
            removeOutput: true
        }, opts)
        this.synchronised = true
    }
    public options: HtmlReporterOptions
    public reportFile : string = ''
    public synchronised : boolean

    isSynchronised() {
        return this.synchronised
    }
    updateSuiteMetrics(metrics: Metrics, suiteInfo : SuiteStats) {
        // metrics.passed += suite.metrics.passed;
        // metrics.failed += suite.metrics.failed;
        // metrics.skipped += suite.metrics.skipped;
        const start = dayjs.utc(suiteInfo.start)
        if (metrics.start) {
            if (start.isBefore(metrics.start)) {
                metrics.start = start.utc().format(timeFormat)
            }
        } else {
            metrics.start = start.utc().format(timeFormat)
        }
        const end = dayjs.utc(suiteInfo.end)
        if (metrics.end) {
            if (end.isAfter(dayjs.utc(metrics.end))) {
                metrics.end = end.utc().format(timeFormat)
            }
        } else {
            metrics.end = end.utc().format(timeFormat)
        }
        this.LOG.info(String.format('Included metrics for suite: {0} {1}', suiteInfo.cid, suiteInfo.uid) )
    }

    async createReport(reportData: ReportData ) {
        this.synchronised = false
        this.LOG.info('Report Generation started')
        const metrics = new Metrics ()

        const suites = reportData.suites
        const specs : string[] =  reportData.info.specs

        for (let j = 0; j < suites.length; j++) {
            try {
                const suite = suites[j]
                this.updateSuiteMetrics(metrics, suite)
                if (suite.suites) {
                    for (let k = 0; k < suite.suites.length; k++) {
                        const suiteInfo = suite.suites[k]
                        this.updateSuiteMetrics(metrics, suiteInfo)
                    }
                }

            } catch (ex) {
                console.error(ex)
            }
        }
        if (!metrics.start || !metrics.end) {
            this.LOG.error(String.format('Invalid Metrics computed: {0} -- {1}', metrics.start, metrics.end))
        }
        metrics.duration = dayjs.duration(dayjs(metrics.end).utc().diff(dayjs(metrics.start).utc())).as('milliseconds')

        this.LOG.info('Generated ' + specs.length + ' specs, ' + suites.length + ' suites, ' )
        this.reportFile = path.resolve(process.cwd(), this.options.outputDir, this.options.filename)
        reportData.reportFile = this.reportFile

        try {
            reportData.reportFile = reportData.reportFile.replace('.html', String.format('-{0}.html', reportData.info.cid))
            await JsonGenerator.jsonOutput(this.options, reportData)
            if (this.options.produceHtml) {
                await HtmlGenerator.htmlOutput(this.options, reportData)
            }
            this.LOG.info('Report Generation completed')
            this.synchronised = true

        } catch (ex) {
            console.error('Report Generation failed: ' + ex)
            this.synchronised = true
        }
    }

}

export default ReportGenerator

