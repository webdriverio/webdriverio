import Timer from '../Timer'

export default class Interception {
    url: string;
    filterOptions: WebdriverIO.MockFilterOptions;
    browser: WebdriverIO.BrowserObject;
    respondOverwrites: {
        overwrite?: WebdriverIO.MockOverwrite;
        params?: WebdriverIO.MockResponseParams;
        sticky?: boolean;
        errorReason?: string;
    }[];
    matches: WebdriverIO.Matches[];
    calls?: WebdriverIO.Matches[];

    constructor (url: string, filterOptions = {}, browser: WebdriverIO.BrowserObject) {
        this.url = url
        this.filterOptions = filterOptions
        this.browser = browser
        this.respondOverwrites = []
        this.matches = []
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
            timeout = this.browser.options.waitforTimeout
        }

        if (typeof interval !== 'number') {
            interval = this.browser.options.waitforInterval
        }

        const fn = () => this.calls && this.calls.length > 0
        const timer = new Timer(interval, timeout, fn, true) as unknown as Promise<void>

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
