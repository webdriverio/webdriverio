import type { SuiteStats } from '@wdio/reporter'
import type { HtmlReporterOptions, ReportData } from './types.js'
import logger from '@wdio/logger'
import fs from 'node:fs'

import { writeFile } from './files.js'
import { withExtension } from './fileNames.js'

// experimental fields of the base that the report does not use; a hook keeps `output` only with commands
const BASE_ONLY_HOOK_KEYS = new Set(['hookKind', 'hookSuiteUid'])
const BASE_ONLY_TEST_KEYS = new Set(['file'])

class JsonGenerator {
    private static LOG = logger('JsonGenerator')

    static writeJson(jsonFile:string, stringified:string) {
        writeFile(jsonFile, stringified)
        JsonGenerator.LOG.info('Json write completed: ' + jsonFile )
    }

    /**
     * remove the command output of the tests and of the hooks, also in nested suites
     */
    static removeOutput(suites: SuiteStats[] = []) {
        for (const suite of suites) {
            for (const test of suite.tests ?? []) {
                test.output = []
            }
            // the base gives a hook the commands that no test owns
            for (const hook of suite.hooks ?? []) {
                if (hook.output) {
                    hook.output = []
                }
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
                        /**
                         * `hooksAndTests` is a second copy of the tests and hooks of a
                         * suite, which the report does not use
                         */
                        const stringified = JSON.stringify(reportData, function (this: { type?: unknown }, key, value) {
                            // an Error has no own enumerable keys: it would be written as {}
                            if (this.type === 'userResult' && key === 'result' && value?.error instanceof Error) {
                                return { error: { name: value.error.name, message: value.error.message } }
                            }
                            return key === 'hooksAndTests' ||
                                (this.type === 'test' && BASE_ONLY_TEST_KEYS.has(key)) ||
                                (this.type === 'hook' && (BASE_ONLY_HOOK_KEYS.has(key) || (key === 'output' && !(Array.isArray(value) && value.length)))) ? undefined : value
                        })
                        JsonGenerator.writeJson(jsonFile, stringified)
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