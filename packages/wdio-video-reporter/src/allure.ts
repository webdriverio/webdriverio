import logger from '@wdio/logger'

const log = logger('@wdio/video-reporter:allure')

export default class AllureReporterExtension {
    reporterAPI: Promise<{ addAttachment: Function, addArgument: Function } | void>
    constructor () {
        this.reporterAPI = import('@wdio/allure-reporter').catch(() => {
            /* v8 ignore next */
            log.info('Allure reporter not found, not attaching video')
        })
    }

    async addAttachment (...args: unknown[]) {
        const reporter = await this.reporterAPI
        if (reporter) {
            reporter.addAttachment(...args)
        }
    }

    async addArgument (...args: unknown[]) {
        const reporter = await this.reporterAPI
        if (reporter) {
            reporter.addArgument(...args)
        }
    }
}
