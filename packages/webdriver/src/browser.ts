import logger from '@testplane/wdio-logger'
import type { WebSocket } from 'ws'

import WebDriver from './index.js'
import { BrowserSocket } from './bidi/socket.js'
import { WebRequest } from './request/web.js'

export default WebDriver
export * from './index.js'

import { environment } from './environment.js'

const log = logger('webdriver')

environment.value = {
    Request: WebRequest,
    Socket: BrowserSocket,
    createBidiConnection: (webSocketUrl: string, options: unknown) => {
        log.info(`Connecting to webSocketUrl ${webSocketUrl}`)
        const ws = new BrowserSocket(webSocketUrl, options)
        return new Promise<WebSocket | undefined>((resolve) => {
            ws.on('open', () => {
                log.info('Connected session to Bidi protocol')
                resolve(ws as unknown as WebSocket)
            })
            ws.on('error', (err) => {
                const error = err instanceof Error ? err : new Error(String(err))
                log.warn(`Couldn't connect to Bidi protocol: ${error.message}`)
                resolve(undefined)
            })
        })
    },
    variables: {}
}
