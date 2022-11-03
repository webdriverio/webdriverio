import url from 'node:url'
import path from 'node:path'

import logger from '@wdio/logger'
import { browser } from '@wdio/globals'
import type { Browser } from 'webdriverio'
import type { Capabilities } from '@wdio/types'

import type BaseReporter from './reporter'
import type { TestFramework } from './types'

const log = logger('@wdio/runner')
const sep = '\n  - '

type WDIOErrorEvent = Pick<ErrorEvent, 'filename' | 'message'>

declare global {
    interface Window {
        __wdioErrors__: WDIOErrorEvent[]
        __wdioEvents__: any[]
        __wdioFailures__: number
    }
}

export default class BrowserFramework implements Omit<TestFramework, 'init'> {
    constructor (
        private _cid: string,
        private _config: unknown,
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: BaseReporter
    ) {}

    /**
     * always return true as it is unrelevant for component testing
     */
    hasTests () {
        return true
    }

    init () {
        return undefined as any as TestFramework
    }

    async run () {
        try {
            const failures = await this.#loop()
            return failures
        } catch (err: any) {
            log.error(`Failed to run browser tests with cid ${this._cid}: ${err.stack}`)
            return 1
        }
    }

    async #loop () {
        /**
         * start tests
         */
        let failures = 0

        for (const spec of this._specs) {
            log.info(`Run spec file ${spec} for cid ${this._cid}`)
            console.log(`Run spec file ${spec} for cid ${this._cid}`)
            await browser.url(`/${this._cid}/test.html?spec=${url.fileURLToPath(spec)}`)
            // await browser.debug()

            /**
             * fetch page errors that are thrown during rendering and let spec file fail
             */
            const jsErrors: WDIOErrorEvent[] = (await browser.execute(() => window.__wdioErrors__)) || ([])
            if (jsErrors.length) {
                const errors = jsErrors.map((ev) => `${path.basename(ev.filename)}: ${ev.message}`)
                const envError = new Error(`Test failed due to following error(s):${sep}${errors.join(sep)}`)
                this._reporter.emit('error', {
                    cid: this._cid,
                    name: 'error',
                    content: envError.message
                })
                failures += 1
                continue
            }

            failures += await this.#fetchEvents(browser, spec)
        }

        return failures
    }

    async #fetchEvents (browser: Browser<'async'>, spec: string): Promise<number> {
        /**
         * wait until tests have finished and results are emitted to the window scope
         */
        let failures: number | null = null
        await browser.waitUntil(async () => {
            while (typeof failures !== 'number') {
                failures = await browser?.execute(() => (
                    window.__wdioEvents__.length > 0
                        ? window.__wdioFailures__
                        : null
                ))
            }
            return true
        }, {
            timeoutMsg: 'browser test timed out'
        })

        /**
         * populate events to the reporter
         */
        const events = await browser.execute(() => window.__wdioEvents__)
        for (const ev of events) {
            if ((ev.type === 'suite:start' || ev.type === 'suite:end') && ev.title === '') {
                continue
            }
            this._reporter.emit(ev.type, {
                ...ev,
                file: spec,
                uid: this._cid,
                cid: this._cid
            })
        }

        return failures! as number
    }

    static init (cid: string, config: unknown, specs: string[], caps: Capabilities.RemoteCapability, reporter: BaseReporter) {
        const framework = new BrowserFramework(cid, config, specs, caps, reporter)
        return framework
    }
}
