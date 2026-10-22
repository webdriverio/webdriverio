import HtmlGenerator from './htmlGenerator.js'
import { HtmlReporterOptions, type ReportData } from './types.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
dayjs.extend(utc)
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'
dayjs.extend(isSameOrBefore)
import path from 'node:path'
import logger from '@wdio/logger'
import JsonGenerator from './jsonGenerator.js'
import { workerFile } from './fileNames.js'

class ReportGenerator {
    private LOG = logger('ReportGenerator')
    constructor(opts: Partial<HtmlReporterOptions> = {}) {
        // the defaults of the reporter (also produceJson), as the ReportAggregator uses them
        this.options = Object.assign(new HtmlReporterOptions(), {
            filename: 'master-report.html',
            reportTitle: 'Test Master Report'
        }, opts)
        this.synchronised = true
    }
    public options: HtmlReporterOptions
    public reportFile : string = ''
    public synchronised : boolean

    isSynchronised() {
        return this.synchronised
    }
    /**
     * Write the worker file of a report that is not complete. The report at the end
     * of the run replaces it: when the worker stops before (for example it is killed)
     * or cannot write that report, the ReportAggregator finds this file.
     */
    startReport(reportData: ReportData) {
        reportData.reportFile = workerFile(path.resolve(reportData.reportFile), reportData.info.cid)
        reportData.incomplete = true
        return JsonGenerator.jsonOutput(this.options, reportData)
    }

    async createReport(reportData: ReportData ) {
        this.synchronised = false
        this.LOG.info('Report Generation started')
        // the metrics of the report come from the reporter
        const suites = reportData.suites
        const specs : string[] =  reportData.info.specs

        this.LOG.info('Generated ' + specs.length + ' specs, ' + suites.length + ' suites, ' )
        // the report file of the data (the reporter sets it from its options), with the cid of the worker
        this.reportFile = workerFile(path.resolve(reportData.reportFile), reportData.info.cid)
        reportData.reportFile = this.reportFile

        try {
            await JsonGenerator.jsonOutput(this.options, reportData)
            // the HTML report of a worker is often the only report: its errors are in the reporter log
            if (this.options.produceHtml && !await HtmlGenerator.htmlOutput(this.options, reportData)) {
                console.error(`[@wdio/html-reporter] The report ${this.reportFile} is not complete: see the errors in the reporter log`)
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

