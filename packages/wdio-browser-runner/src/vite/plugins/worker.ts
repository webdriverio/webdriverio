import type { Plugin, WebSocketClient } from 'vite'
import type { Workers } from '@wdio/types'

import { WDIO_EVENT_NAME } from '../../constants.js'

export type SocketEventHandler = (data: Workers.SocketMessage, client: WebSocketClient) => void

/**
 * a Vite plugin to help communicate with the worker process
 */
export function workerPlugin (onSocketEvent: SocketEventHandler): Plugin {
    return {
        name: 'wdio:worker',
        configureServer ({ ws }) {
            ws.on(WDIO_EVENT_NAME, onSocketEvent)
        }
    }
}
