import url from 'node:url'
import path from 'node:path'
import { EventEmitter } from 'node:events'

import logger from '@wdio/logger'
import { Browser } from 'webdriverio'
import { BaseReporter } from '@wdio/runner'
import type { Options } from '@wdio/types'

import type { ViteDevServer } from 'vite'

import { SESSIONS } from './constants.js'
import type { RunArgs, WDIOErrorEvent } from './types'

const log = logger('@wdio/browser-runner:session')
const sep = '\n  - '

export default class SessionWorker extends EventEmitter {
    #server: ViteDevServer
    #args: RunArgs
    #config: Options.Testrunner

    constructor (config: Options.Testrunner, args: RunArgs, server: ViteDevServer) {
        super()
        this.#config = config
        this.#args = args
        this.#server = server
    }

    async run (browserPromise: Promise<Browser<'async'>>) {
        const browser = await browserPromise
        const specs = this.#args.specs.map(
            (spec) => url.fileURLToPath(spec.replace(this.#server.config.root, '')))

        SESSIONS.set(this.#args.cid, {
            args: this.#config.mochaOpts || {},
            capabilities: browser.capabilities,
            sessionId: browser.sessionId
        })

        /**
         * initiate reporters
         */
        const reporter = new BaseReporter(this.#config, this.#args.cid, browser.capabilities)
        await reporter.initReporters()
        reporter.onMessage((payload: any) => {
            this.emit('message', payload)
        })
        reporter.emit('runner:start', {
            cid: this.#args.cid,
            specs,
            config: this.#config,
            isMultiremote: false,
            instanceOptions: {},
            capabilities: browser.capabilities,
            retry: 0
        })

        this.emit('message', {
            name: 'testFrameworkInit',
            content: {
                cid: this.#args.cid,
                caps: this.#args.caps,
                specs,
                hasTests: true
            }
        })

        try {
            /**
             * start tests
             */
            let failures = 0
            for (const spec of specs) {
                log.info(`Run spec file ${spec} for cid ${this.#args.cid}`)
                await browser.url(`/test.html?cid=${this.#args.cid}&spec=${spec}`)
                await browser.debug()

                /**
                 * fetch page errors that are thrown during rendering and let spec file fail
                 */
                const jsErrors: WDIOErrorEvent[] = (await browser.execute(() => window.__wdioErrors__)) || ([])
                if (jsErrors.length) {
                    const errors = jsErrors.map((ev) => `${path.basename(ev.filename)}: ${ev.message}`)
                    const envError = new Error(`Test failed due to following error(s):${sep}${errors.join(sep)}`)
                    this.emit('error', {
                        cid: this.#args.cid,
                        name: 'error',
                        content: envError.message
                    })
                    failures += 1
                    continue
                }

                failures += await this.#fetchEvents(browser, reporter, spec)
            }

            reporter.emit('runner:end', {
                failures,
                cid: this.#args.cid,
                retries: 0
            } as Options.RunnerEnd)

            await reporter.waitForSync()

            this.emit('exit', {
                cid: this.#args.cid,
                exitCode: failures === 0 ? 0 : 1,
                specs: this.#args.specs,
                retries: 0
            })
        } catch (err: any) {
            this.#errorOut(`Failed to run browser tests with cid ${this.#args.cid}: ${err.stack}`)
        }
    }

    async #fetchEvents (browser: Browser<'async'>, reporter: BaseReporter, spec: string): Promise<number> {
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
            reporter.emit(ev.type, {
                ...ev,
                file: spec,
                uid: this.#args.cid,
                cid: this.#args.cid
            })
        }

        return failures! as number
    }

    #errorOut (message: string) {
        log.error(message)
        this.emit('error', { message })
        this.emit('exit', { exitCode: 1, specs: this.#args.specs, cid: this.#args.cid, retries: this.#args.retries })
    }
}
