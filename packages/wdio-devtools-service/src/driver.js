import puppeteer from 'puppeteer-core'

import logger from '@wdio/logger'

const log = logger('@wdio/devtools-service:DevToolsDriver')

/**
 * connects a puppeteer instance to the browser
 */
export default class DevToolsDriver {
    constructor (browser) {
        this.browser = browser

        /**
         * ToDo (Christian): handle target changes
         * this should usually never happens as we only connect within one
         * target within the VM so maybe we can discard this
         */
    }

    static async attach (url) {
        log.info(`Connect to ${url}`)
        const browser = await puppeteer.connect({
            browserURL: url,
            defaultViewport: null
        })
        return new DevToolsDriver(browser)
    }

    async getActiveTarget () {
        if (this.target) {
            return this.target
        }

        const target = this.target = await this.browser.waitForTarget(
            /* istanbul ignore next */
            (t) => t.type() === 'page')
        return target
    }

    async getActivePage () {
        if (this.page) {
            return this.page
        }

        const target = await this.getActiveTarget()
        this.page = await target.page()
        return this.page
    }

    async getCDPSession () {
        if (this.cdpSession) {
            return this.cdpSession
        }

        const target = await this.getActiveTarget()
        this.cdpSession = await target.createCDPSession()
        return this.cdpSession
    }

    async send (method, params) {
        const cdpSession = await this.getCDPSession()
        return cdpSession.send(method, params)
    }
}
