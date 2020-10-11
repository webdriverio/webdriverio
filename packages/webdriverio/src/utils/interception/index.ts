/// <reference types="webdriverio/webdriverio"/>
import Timer from '../Timer'

type FilterOptions = {
    method?: string;
    header?: object;
    responseHeaders?: object;
};

type WaitForResponseFn = {
    timeout?: number;
    interval?: number;
    timeoutMsg?: string;
}

export default class Interception {
    url: string;
    filterOptions: FilterOptions;
    browser: WebdriverIO.Browser;
    respondOverwrites: {
        overwrite: any;
        params: object;
        sticky: boolean;
        errorReason: string;
    }[];
    matches: any[];
    calls?: any[];

    constructor (url: string, filterOptions = {}, browser: WebdriverIO.Browser) {
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
    }: WaitForResponseFn = {}) {
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
