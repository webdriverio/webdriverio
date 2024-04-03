import EventEmitter from 'node:events'

import Timer from '../Timer.js'

import type { WaitForOptions } from '../../types.js'
import type {
    MockOptions, MockOverwrite, MockResponseParams, Matches,
    ErrorReason, RequestWithOptions
} from './types.js'

export default abstract class Interception {
    protected emitter = new EventEmitter()

    constructor (
        public url: string | RegExp,
        public filterOptions: MockOptions = {},
        public browser: WebdriverIO.Browser
    ) {}

    abstract calls: Array<unknown> | Promise<Array<unknown>>
    abstract clear (): void
    abstract restore (): void

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

export abstract class DevtoolsInterception extends Interception {
    abstract calls: Matches[] | Promise<Matches[]>
    abstract clear (): void
    abstract restore (): Promise<void>
    abstract respond (overwrite: MockOverwrite, params: MockResponseParams): void
    abstract respondOnce (overwrite: MockOverwrite, params: MockResponseParams): void
    abstract abort (errorReason: ErrorReason, sticky: boolean): void
    abstract abortOnce (errorReason: ErrorReason): void

    respondOverwrites: {
        overwrite?: MockOverwrite
        requestWith?: RequestWithOptions
        params?: MockResponseParams
        sticky?: boolean
        errorReason?: ErrorReason
    }[] = []
    matches: Matches[] = []
}
