import { EventEmitter } from 'node:events'
import WebSocket from 'ws'
import logger from '@wdio/logger'

import type { CommandData } from './remoteTypes.js'
import type { CommandResponse } from './localTypes.js'

const log = logger('webdriver')
const RESPONSE_TIMEOUT = 1000 * 60

export class BidiCore extends EventEmitter {
    #id = 0
    #ws: WebSocket
    #isConnected = false

    constructor (private _webSocketUrl: string) {
        super()
        log.info(`Connect to webSocketUrl ${this._webSocketUrl}`)
        this.#ws = new WebSocket(this._webSocketUrl)
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

    public send (params: CommandData) {
        const id = this.sendAsync(params)
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
                            return reject(new Error(payload.error))
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

    public sendAsync (params: CommandData) {
        if (!this.#isConnected) {
            throw new Error('No connection to WebDriver Bidi was established')
        }

        const id = ++this.#id
        this.#ws.send(JSON.stringify({ id, ...params }))
        return id
    }
}
