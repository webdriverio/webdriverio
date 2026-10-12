import type { HtmlReporterOptions, ReportData } from './types.js'
import logger from '@wdio/logger'
import json from 'big-json'
import fs from 'fs-extra'

class JsonGenerator {
    private static LOG = logger('JsonGenerator')

    static writeJson(jsonFile:string, stringified:string, _reportOptions:HtmlReporterOptions, _reportData: ReportData) {
        fs.outputFileSync(jsonFile, stringified)
        JsonGenerator.LOG.info('Json write completed: ' + jsonFile )
    }

    static async jsonOutput(reportOptions: HtmlReporterOptions, reportData: ReportData) {

        try {

            if (fs.pathExistsSync(reportOptions.outputDir)) {
                if (reportOptions.removeOutput) {
                    for (let i = 0; i < reportData.suites.length; i++) {
                        const suite = reportData.suites[i]
                        for (let j = 0; j < suite.tests.length; j++) {
                            const test = suite.tests[j]
                            test.output = []
                        }
                    }
                }

                if (reportOptions.produceJson ) {
                    const jsonFile = reportData.reportFile.replace('.html', '.json')
                    JsonGenerator.LOG.info('Json report write starting: ' + jsonFile)
                    try {
                        const stringified = await json.stringify({ body: reportData })
                        JsonGenerator.writeJson(jsonFile, stringified, reportOptions, reportData)
                    } catch (error) {
                        JsonGenerator.LOG.error('Json write failed: ' + error)
                    }
                } else {
                    JsonGenerator.LOG.info('reportOptions.produceJson is false')
                }
            }
            JsonGenerator.LOG.info('Json Generation Completed')
        } catch (ex) {
            JsonGenerator.LOG.error('Json Generation processing ended in error: ' + ex)
        }
    }
}

export default JsonGenerator