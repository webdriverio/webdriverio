import Timer from '../Timer'

import { WaitForOptions } from '../../types'
import { MockFilterOptions, MockOverwrite, MockResponseParams, Matches } from './types'
import type Protocol from 'devtools-protocol'

export default abstract class Interception {
    abstract calls: Matches[] | Promise<Matches[]>
    abstract clear (): void
    abstract restore (): void
    abstract respond (overwrite: MockOverwrite, params: MockResponseParams): void
    abstract respondOnce (overwrite: MockOverwrite, params: MockResponseParams): void
    abstract abort (errorReason: Protocol.Network.ErrorReason, sticky: boolean): void
    abstract abortOnce (errorReason: Protocol.Network.ErrorReason): void

    url: string
    filterOptions: MockFilterOptions
    browser: WebdriverIO.Browser
    respondOverwrites: {
        overwrite?: MockOverwrite
        params?: MockResponseParams
        sticky?: boolean
        errorReason?: Protocol.Network.ErrorReason
    }[] = []
    matches: Matches[] = []

    constructor (url: string, filterOptions: MockFilterOptions = {}, browser: WebdriverIO.Browser) {
        this.url = url
        this.filterOptions = filterOptions
        this.browser = browser
    }

    waitForResponse ({
        timeout = this.browser.options.waitforTimeout,
        interval = this.browser.options.waitforInterval,
        timeoutMsg,
    }: WaitForOptions = {}) {
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
