import WebSocket from 'ws'
import logger from '@wdio/logger'

import type { CommandData } from './remoteTypes.js'
import type { CommandResponse } from './localTypes.js'
import type { ClientRequestArgs } from 'node:http'

const log = logger('webdriver')
const RESPONSE_TIMEOUT = 1000 * 60

export class BidiCore {
    #id = 0
    #ws: WebSocket
    #isConnected = false

    constructor (private _webSocketUrl: string, opts?: WebSocket.ClientOptions | ClientRequestArgs) {
        log.info(`Connect to webSocketUrl ${this._webSocketUrl}`)
        this.#ws = new WebSocket(this._webSocketUrl, opts)
    }

    public connect () {
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
                reject(new Error(`Request with id ${id} timed out`))
                h.off('message', listener)
            }, RESPONSE_TIMEOUT)

            const listener = (data: WebSocket.RawData) => {
                try {
                    const payload = JSON.parse(data.toString()) as CommandResponse
                    if (payload.id === id) {
                        clearTimeout(t)
                        h.off('message', listener)
                        log.info('BIDI RESULT', JSON.stringify(payload))
                        if (payload.error) {
                            failError.message += ` with error: ${payload.error}`
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

        log.info('BIDI COMMAND', params.method, JSON.stringify(params.params))
        const id = ++this.#id
        this.#ws.send(JSON.stringify({ id, ...params }))
        return id
    }
}
