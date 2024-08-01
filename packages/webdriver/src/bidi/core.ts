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

    constructor (private _webSocketUrl: string, opts?: ClientOptions) {
        log.info(`Connect to webSocketUrl ${this._webSocketUrl}`)
        this.#ws = new Socket(this._webSocketUrl, opts) as WebSocket
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

    public send (params: Omit<CommandData, 'id'>) {
        const id = this.sendAsync(params)
        const failError = new Error(`WebDriver Bidi command "${params.method}" failed`)
        return new Promise<CommandResponse>((resolve, reject) => {
            const t = setTimeout(() => {
                reject(new Error(`Command ${params.method} with id ${id} (with the following parameter: ${JSON.stringify(params.params)}) timed out`))
                h.off('message', listener)
            }, RESPONSE_TIMEOUT)

            const listener = (data: RawData) => {
                try {
                    const payload = JSON.parse(data.toString()) as CommandResponse
                    if (payload.id === id) {
                        clearTimeout(t)
                        h.off('message', listener)
                        log.info('BIDI RESULT', JSON.stringify(payload))
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

                            return reject(failError)
                        }
                        resolve(payload)
                    }
                } catch (err: any) {
                    log.error(`Failed parse message: ${err.message}`)
                }
            }
            const h = this.#ws.on('message', listener)
        })
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
        const logString = `{ functionDeclaration: <PreloadScript[${Buffer.byteLength(param.functionDeclaration, 'utf-8')} bytes]>, contexts: ${JSON.stringify(param.contexts)} }`
        return [commandName, logString]
    }

    return [commandName, JSON.stringify(params.params)]
}
