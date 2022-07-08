import { EventEmitter } from 'node:events'
import WebSocket from 'ws'
import logger from '@wdio/logger'
import { BidiRequest, BidiResponse } from '@wdio/protocols'

const log = logger('webdriver:BidiHandler')
const RESPONSE_TIMEOUT = 1000 * 60

export class BidiHandler extends EventEmitter {
    private _id = 0
    private _ws: WebSocket
    private _isConnected = false

    constructor (private _webSocketUrl: string) {
        super()
        log.info(`Connect to webSocketUrl ${this._webSocketUrl}`)
        this._ws = new WebSocket(this._webSocketUrl)
    }

    public connect () {
        return new Promise<void>((resolve) => this._ws.on('open', () => {
            this._isConnected = true
            resolve()
        }))
    }

    get socket () {
        return this._ws
    }

    public send (params: BidiRequest) {
        if (!this._isConnected) {
            throw new Error('No connection to WebDriver Bidi was established')
        }

        const id = ++this._id
        this._ws.send(JSON.stringify({ id, ...params }))
        return new Promise<BidiResponse>((resolve, reject) => {
            const t = setTimeout(() => {
                reject(new Error(`Request with id ${id} timed out`))
                h.off('message', listener)
            }, RESPONSE_TIMEOUT)

            const listener = (data: WebSocket.RawData) => {
                try {
                    const payload = JSON.parse(data.toString()) as BidiResponse
                    if (payload.id === id) {
                        clearTimeout(t)
                        h.off('message', listener)
                        resolve(payload)
                    }
                } catch (err: any) {
                    log.error(`Failed parse message: ${err.message}`)
                }
            }
            const h = this._ws.on('message', listener)
        })
    }

    public sendAsync (params: BidiRequest) {
        if (!this._isConnected) {
            throw new Error('No connection to WebDriver Bidi was established')
        }

        const id = ++this._id
        this._ws.send(JSON.stringify({ id, ...params }))
    }
}
