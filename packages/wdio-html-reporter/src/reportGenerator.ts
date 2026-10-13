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
    async createReport(reportData: ReportData ) {
        this.synchronised = false
        this.LOG.info('Report Generation started')
        // the metrics of the report come from the reporter
        const suites = reportData.suites
        const specs : string[] =  reportData.info.specs

        this.LOG.info('Generated ' + specs.length + ' specs, ' + suites.length + ' suites, ' )
        this.reportFile = path.resolve(process.cwd(), this.options.outputDir, this.options.filename)
        reportData.reportFile = this.reportFile

        try {
            reportData.reportFile = workerFile(reportData.reportFile, reportData.info.cid)
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

