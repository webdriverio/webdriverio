import logger from '@wdio/logger'
import type { ClientOptions, RawData, WebSocket } from 'ws'

import Socket from './socket.js'
import type * as remote from './remoteTypes.js'
import type { CommandData } from './remoteTypes.js'
import type { CommandResponse } from './localTypes.js'

const log = logger('webdriver')
const RESPONSE_TIMEOUT = 1000 * 60

export class BidiCore {
    #id = 0
    #ws: WebSocket
    #isConnected = false
    #pendingCommands: Map<number, (value: CommandResponse) => void> = new Map()

    constructor (private _webSocketUrl: string, opts?: ClientOptions) {
        log.info(`Connect to webSocketUrl ${this._webSocketUrl}`)
        this.#ws = new Socket(this._webSocketUrl, opts) as WebSocket
        this.#ws.on('message', this.#handleResponse.bind(this))
    }

    public async connect () {
        /**
         * don't connect and stale unit tests when the websocket url is set to a dummy value
         * Note: the value is defined in __mocks__/fetch.ts
         */
        if (process.env.VITEST_WORKER_ID && this._webSocketUrl === 'ws://webdriver.io') {
            return
        }
        return new Promise<void>((resolve) => this.#ws.on('open', () => {
            log.info('Connected session to Bidi protocol')
            this.#isConnected = true
            resolve()
        }))
    }

    get socket () {
        return this.#ws
    }

    get isConnected () {
        return this.#isConnected
    }

    /**
     * for testing purposes only
     * @internal
     */
    get __handleResponse () {
        return this.#handleResponse.bind(this)
    }

    #handleResponse (data: RawData) {
        try {
            const payload = JSON.parse(data.toString()) as CommandResponse
            if (typeof payload.id === 'undefined') {
                return
            }

            log.info('BIDI RESULT', JSON.stringify(payload.result))
            const resolve = this.#pendingCommands.get(payload.id)
            if (!resolve) {
                log.error(`Couldn't resolve command with id ${payload.id}`)
                return
            }

            this.#pendingCommands.delete(payload.id)
            resolve(payload)
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(`Failed parse message: ${String(err)}`)
            log.error(`Failed parse message: ${error.message}`)
        }
    }

    public async send (params: Omit<CommandData, 'id'>): Promise<CommandResponse> {
        const id = this.sendAsync(params)
        const failError = new Error(`WebDriver Bidi command "${params.method}" failed`)
        const payload = await new Promise<CommandResponse>((resolve, reject) => {
            const t = setTimeout(() => {
                reject(new Error(`Command ${params.method} with id ${id} (with the following parameter: ${JSON.stringify(params.params)}) timed out`))
                this.#pendingCommands.delete(id)
            }, RESPONSE_TIMEOUT)
            this.#pendingCommands.set(id, (payload) => {
                clearTimeout(t)
                resolve(payload)
            })
        })

        if (payload.error) {
            failError.message += ` with error: ${payload.error} - ${payload.message}`
            if (payload.stacktrace) {
                const driverStack = payload.stacktrace
                    .split('\n')
                    .filter(Boolean)
                    .map((line: string) => `    at ${line}`)
                    .join('\n')
                failError.stack += `\n\nDriver Stack:\n${driverStack}`
            }

            throw failError
        }

        return payload
    }

    public sendAsync (params: Omit<CommandData, 'id'>) {
        if (!this.#isConnected) {
            throw new Error('No connection to WebDriver Bidi was established')
        }

        log.info('BIDI COMMAND', ...parseBidiCommand(params))
        const id = ++this.#id
        this.#ws.send(JSON.stringify({ id, ...params }))
        return id
    }
}

function parseBidiCommand (params:  Omit<CommandData, 'id'>) {
    const commandName = params.method
    if (commandName === 'script.addPreloadScript') {
        const param = params.params as remote.ScriptAddPreloadScriptParameters
        const logString = `{ functionDeclaration: <PreloadScript[${new TextEncoder().encode(param.functionDeclaration).length} bytes]>, contexts: ${JSON.stringify(param.contexts)} }`
        return [commandName, logString]
    } else if (commandName === 'script.callFunction') {
        const param = params.params as remote.ScriptCallFunctionParameters
        const logString = JSON.stringify({
            ...param,
            functionDeclaration: `<Function[${new TextEncoder().encode(param.functionDeclaration).length} bytes]>`
        })
        return [commandName, logString]
    }

    return [commandName, JSON.stringify(params.params)]
}
