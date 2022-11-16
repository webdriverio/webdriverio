import Mocha from 'https://esm.sh/mocha@10.0.0'
import stringify from 'fast-safe-stringify'

// @ts-expect-error
import { setupEnv, formatMessage } from '@wdio/mocha-framework/common'

import { EVENTS } from '../../constants.js'
import { MESSAGE_TYPES } from '../../vite/constants.js'
import type { HookResultEvent, SocketMessage } from '../../vite/types'

export class MochaFramework {
    #socket: WebSocket
    #hookResolver = new Map<string, { resolve: Function, reject: Function }>()
    #mocha: any
    #runnerEvents: any[] = []

    constructor (socket: WebSocket) {
        this.#mocha = Mocha.setup({
            ...window.__wdioEnv__.args,
            reporter: HTMLReporter
        })

        this.#socket = socket
        socket.addEventListener('message', this.#handleSocketMessage.bind(this))
    }

    run () {
        const [cid] = window.location.pathname.slice(1).split('/')
        if (!cid) {
            throw new Error('"cid" query parameter is missing')
        }

        const beforeHook = this.#getHook('beforeHook')
        const beforeTest = this.#getHook('beforeTest')
        const afterHook = this.#getHook('afterHook')
        const afterTest = this.#getHook('afterTest')
        setupEnv(cid, window.__wdioEnv__.args, beforeTest, beforeHook, afterTest, afterHook)

        console.log('[WDIO] Start Mocha testsuite')
        const startTime = Date.now()
        const runner = this.#mocha.run(async (failures: number) => {
            await this.#getHook('after')(failures, window.__wdioEnv__.capabilities, [window.__wdioSpec__])

            /**
             * propagate results to browser so it can be picked up by the runner
             */
            // @ts-ignore
            window.__wdioEvents__ = this.#runnerEvents
            window.__wdioFailures__ = failures
        })

        runner.suite.beforeAll(() => this.#getHook('beforeSuite')({
            ...runner.suite.suites[0],
            file: window.__wdioSpec__,
        }))
        runner.suite.afterAll(() => this.#getHook('afterSuite')({
            ...runner.suite.suites[0],
            file: window.__wdioSpec__,
            duration: Date.now() - startTime
        }))

        Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => runner.on(mochaEvent, (payload: any) => {
            this.#runnerEvents.push(formatMessage({ type: wdioEvent, payload, err: payload.err }))
        }))
    }

    #handleSocketMessage (payload: MessageEvent) {
        try {
            const message: SocketMessage = JSON.parse(payload.data)
            if (message.type === MESSAGE_TYPES.hookResultMessage) {
                return this.#handleHookResult(message.value)
            }

            // no-op
        } catch (err: any) {
            console.error(`Failed handling message from Vite server: ${err.stack}`)
        }
    }

    #handleHookResult (result: HookResultEvent) {
        const resolver = this.#hookResolver.get(result.id)
        if (!resolver) {
            return console.warn(`[WDIO] couldn't find resolve for id "${result.id}"`)
        }

        this.#hookResolver.delete(result.id)
        if (result.error) {
            return resolver.reject(result.error)
        }
        return resolver.resolve()
    }

    #getHook (name: string) {
        return (...args: any[]) => new Promise((resolve, reject) => {
            const id = this.#hookResolver.size + 1
            const [cid] = window.location.pathname.slice(1).split('/')
            if (!cid) {
                return reject(new Error('"cid" query parameter is missing'))
            }

            this.#hookResolver.set(id.toString(), { resolve, reject })
            this.#socket.send(stringify({ type: 'hook', name, id, cid, args }))
        })
    }
}

const BaseReporter = Mocha.reporters.html

export default class HTMLReporter extends BaseReporter {
    constructor (runner: any, options: any) {
        super(runner, options)
    }

    addCodeToggle () {}
}
