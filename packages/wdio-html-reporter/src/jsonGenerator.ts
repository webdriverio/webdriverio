import type { SuiteStats } from '@wdio/reporter'
import type { HtmlReporterOptions, ReportData } from './types.js'
import logger from '@wdio/logger'
import fs from 'node:fs'

import { writeFile } from './files.js'
import { withExtension } from './fileNames.js'

class JsonGenerator {
    private static LOG = logger('JsonGenerator')

    static writeJson(jsonFile:string, stringified:string, _reportOptions:HtmlReporterOptions, _reportData: ReportData) {
        writeFile(jsonFile, stringified)
        JsonGenerator.LOG.info('Json write completed: ' + jsonFile )
    }

    /**
     * remove the command output of the tests, also in nested suites
     */
    static removeOutput(suites: SuiteStats[] = []) {
        for (const suite of suites) {
            for (const test of suite.tests ?? []) {
                test.output = []
            }
            JsonGenerator.removeOutput(suite.suites)
        }
    }

    static async jsonOutput(reportOptions: HtmlReporterOptions, reportData: ReportData) {

        try {

            if (fs.existsSync(reportOptions.outputDir)) {
                if (reportOptions.removeOutput) {
                    JsonGenerator.removeOutput(reportData.suites)
                }

                if (reportOptions.produceJson ) {
                    const jsonFile = withExtension(reportData.reportFile, '.json')
                    JsonGenerator.LOG.info('Json report write starting: ' + jsonFile)
                    try {
                        const stringified = JSON.stringify(reportData)
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