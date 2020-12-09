import Timer from '../Timer'

export default class Interception {
    url: string
    filterOptions: WebdriverIO.MockFilterOptions
    browser: WebdriverIO.BrowserObject
    respondOverwrites: {
        overwrite?: WebdriverIO.MockOverwrite
        params?: WebdriverIO.MockResponseParams
        sticky?: boolean
        errorReason?: string
    }[] = []
    matches: WebdriverIO.Matches[] = []

    constructor (url: string, filterOptions: WebdriverIO.MockFilterOptions = {}, browser: WebdriverIO.BrowserObject) {
        this.url = url
        this.filterOptions = filterOptions
        this.browser = browser
    }

    get calls (): WebdriverIO.Matches[] | Promise<WebdriverIO.Matches[]> {
        throw new Error('Implement me')
    }

    waitForResponse ({
        timeout = this.browser.options.waitforTimeout,
        interval = this.browser.options.waitforInterval,
        timeoutMsg,
    }: WebdriverIO.WaitForOptions = {}) {
        /*!
         * ensure that timeout and interval are set properly
         */
        if (typeof timeout !== 'number') {
            timeout = this.browser.options.waitforTimeout as number
        }

        if (typeof interval !== 'number') {
            interval = this.browser.options.waitforInterval as number
        }

        /* istanbul ignore next */
        const fn = async () => this.calls && (await this.calls).length > 0
        const timer = new Timer(interval, timeout, fn, true) as any as Promise<boolean>

        return this.browser.call(() => timer.catch((e) => {
            if (e.message === 'timeout') {
                if (typeof timeoutMsg === 'string') {
                    throw new Error(timeoutMsg)
                }
                throw new Error(`waitForResponse timed out after ${timeout}ms`)
            }

            throw new Error(`waitForResponse failed with the following reason: ${(e && e.message) || e}`)
        }))
    }
}
