import logger from '@wdio/logger'

const log = logger('@wdio/video-reporter:allure')

type AllureApi = { addAttachment: Function, addArgument: Function }

export default class AllureReporterExtension {
    #api?: Promise<AllureApi | void>

    /**
     * the API of the Allure reporter, imported at the first use: the reporter calls
     * it only when Allure is in the reporters
     */
    get reporterAPI () {
        this.#api ??= import('@wdio/allure-reporter').catch(() => {
            /* v8 ignore next */
            log.info('Allure reporter not found, not attaching video')
        })
        return this.#api
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
