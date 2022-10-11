import url from 'node:url'
import { EventEmitter } from 'node:events'

import logger from '@wdio/logger'
import { remote, Browser } from 'webdriverio'
import { BaseReporter } from '@wdio/runner'
import type { Options } from '@wdio/types'

import type { ViteDevServer } from 'vite'

import { SESSIONS } from './constants.js'
import type { RunArgs } from './types'

const log = logger('@wdio/browser-runner:session')

export default class SessionWorker extends EventEmitter {
    #server: ViteDevServer
    #args: RunArgs
    #config: Options.Testrunner
    #browser?: Browser<'async'>

    constructor (config: Options.Testrunner, args: RunArgs, server: ViteDevServer) {
        super()
        this.#config = config
        this.#args = args
        this.#server = server
    }

    async run () {
        this.#browser = await this.#initSession()
        await this.#runSession()
        await this.#shutdownSession()

        return this.emit('exit', { exitCode: 0 })
    }

    async #runSession () {
        /**
         * don't start if session couldn't be established
         */
        if (!this.#browser) {
            return
        }

        SESSIONS.set(this.#args.cid, {
            args: this.#config.mochaOpts || {},
            specs: this.#args.specs.map((spec) =>
                url.fileURLToPath(spec.replace(this.#server.config.root, ''))
            )
        })

        try {
            log.info(`Start running tests for ${this.#args.cid}`)

            /**
             * initiate reporters
             */
            const reporter = new BaseReporter(this.#config, this.#args.cid, this.#browser.capabilities)
            await reporter.initReporters()
            reporter.onMessage((payload: any) => {
                this.emit('message', payload)
            })
            reporter.emit('runner:start', {
                cid: this.#args.cid,
                specs: this.#args.specs,
                config: this.#config,
                isMultiremote: false,
                instanceOptions: {},
                capabilities: this.#browser.capabilities,
                retry: 0
            })

            /**
             * start tests
             */
            await this.#browser.url(`/test.html?cid=${this.#args.cid}`)

            let failures = -1
            await this.#browser.waitUntil(async () => {
                while (failures === -1) {
                    failures = await this.#browser?.execute(() => (
                        // @ts-expect-error define in window scope
                        window.__wdioEvents__.length > 0
                            // @ts-expect-error define in window scope
                            ? window.__wdioFailures__
                            : -1
                    ))
                }
                return true
            }, {
                timeoutMsg: 'browser test timed out'
            })

            /**
             * populate events
             */
            // @ts-expect-error define in window scope
            const events = await this.#browser.execute(() => window.__wdioEvents__)
            for (const ev of events) {
                if (ev.type === 'suite:start' && ev.title === '') {
                    continue
                }
                reporter.emit(ev.type, ev)
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

    async #shutdownSession () {
        /**
         * don't shutdown anything if session couldn't be established
         */
        if (!this.#browser) {
            return
        }

        try {
            log.info(`Shutdown browser session with cid ${this.#args.cid}`)
            await this.#browser.deleteSession()
        } catch (err: any) {
            this.#errorOut(`Failed to shutdown browser session with cid ${this.#args.cid}: ${err.message}`)
        }
    }

    async #initSession (): Promise<Browser<'async'> | undefined> {
        try {
            log.info(`Initiate browser session with cid ${this.#args.cid}`)
            return await remote({
                capabilities: this.#args.caps,
                baseUrl: `http://localhost:${this.#server.config.server.port}`
            })
        } catch (err: any) {
            this.#errorOut(`Failed to start browser session with cid ${this.#args.cid}: ${err.message}`)
        }
    }

    #errorOut (message: string) {
        log.error(message)
        this.emit('error', { message })
        this.emit('exit', { exitCode: 1 })
    }
}
