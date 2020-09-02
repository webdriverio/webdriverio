import Timer from '../Timer'

export default class Interception {
    constructor (url, filterOptions = {}, browser) {
        this.url = url
        this.filterOptions = filterOptions
        this.browser = browser
        this.respondOverwrites = []
        this.matches = []
    }

    waitForResponse ({
        timeout = this.browser.options.waitforTimeout,
        interval = this.browser.options.waitforInterval,
        timeoutMsg
    } = {}) {
        /*!
         * ensure that timeout and interval are set properly
         */
        if (typeof timeout !== 'number') {
            timeout = this.browser.options.waitforTimeout
        }

        if (typeof interval !== 'number') {
            interval = this.browser.options.waitforInterval
        }

        const fn = () => this.calls.length > 0
        const timer = new Timer(interval, timeout, fn, true)

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
