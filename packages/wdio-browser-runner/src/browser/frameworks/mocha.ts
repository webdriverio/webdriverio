import Mocha from 'mocha'
import stringify from 'fast-safe-stringify'

import { setupEnv, formatMessage } from '@wdio/mocha-framework/common'

import { MESSAGE_TYPES, EVENTS } from '../../constants.js'
import type { HookResultEvent, HookTriggerEvent, SocketMessage } from '../../vite/types.js'

const startTime = Date.now()

export class MochaFramework {
    #socket: WebSocket
    #hookResolver = new Map<string, { resolve: Function, reject: Function }>()
    #runnerEvents: any[] = []

    constructor (socket: WebSocket) {
        this.#socket = socket
        socket.addEventListener('message', this.#handleSocketMessage.bind(this))
        const [cid] = window.location.pathname.slice(1).split('/')
        if (!cid) {
            throw new Error('"cid" query parameter is missing')
        }

        const beforeHook = this.#getHook('beforeHook')
        const beforeTest = this.#getHook('beforeTest')
        const afterHook = this.#getHook('afterHook')
        const afterTest = this.#getHook('afterTest')
        setupEnv(cid, window.__wdioEnv__.args, beforeTest, beforeHook, afterTest, afterHook)

        const self = this
        before(function () {
            self.#getHook('beforeSuite')({
                ...this.test?.parent?.suites[0],
                file: window.__wdioSpec__,
            })
        })

        after(function () {
            self.#getHook('afterSuite')({
                ...this.test?.parent?.suites[0],
                file: window.__wdioSpec__,
                duration: Date.now() - startTime
            })
        })
    }

    run () {
        const runner = mocha.run(this.#onFinish.bind(this))
        Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => runner.on(mochaEvent, (payload: any) => {
            this.#runnerEvents.push(formatMessage({ type: wdioEvent, payload, err: payload.err }))
        }))
    }

    async #onFinish (failures: number) {
        await this.#getHook('after')(failures, window.__wdioEnv__.capabilities, [window.__wdioSpec__])

        /**
         * propagate results to browser so it can be picked up by the runner
         */
        window.__wdioEvents__ = this.#runnerEvents
        window.__wdioFailures__ = failures
        console.log(`[WDIO] Finished test suite in ${Date.now() - startTime}ms`)
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
            const id = (this.#hookResolver.size + 1).toString()
            const [cid] = window.location.pathname.slice(1).split('/')
            if (!cid) {
                return reject(new Error('"cid" query parameter is missing'))
            }

            this.#hookResolver.set(id.toString(), { resolve, reject })
            this.#socket.send(stringify(this.#hookTrigger({ name, id, cid, args })))
        })
    }

    #hookTrigger (value: HookTriggerEvent): SocketMessage {
        return {
            type: MESSAGE_TYPES.hookTriggerMessage,
            value
        }
    }
}

// @ts-expect-error
const BaseReporter = window.Mocha.reporters.html
class HTMLReporter extends BaseReporter {
    addCodeToggle () {}
}

Mocha.setup({
    ...window.__wdioEnv__.args,
    reporter: HTMLReporter
} as any)
