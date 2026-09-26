import type { Plugin, WebSocketClient } from 'vite'

import { WDIO_EVENT_NAME } from '../../constants.js'

/**
 * Vite hands the websocket payload through as untrusted data. Callers parse it
 * with `parseBrowserToRunnerMessage` / `routeBrowserToRunnerMessage` before use.
 */
export type SocketEventHandler = (data: unknown, client: WebSocketClient) => void

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
