/**
 * A WebSocket implementation that wraps the browser native WebSocket
 * interface and exposes a similar interface to the Node.js WebSocket
 */
export class BrowserSocket {
    #callbacks = new Set<Callback>()
    #ws: WebSocket

    constructor (wsUrl: string, _opts: unknown) {
        this.#ws = new globalThis.WebSocket(wsUrl)
        this.#ws.onmessage = this.handleMessage.bind(this)
    }

    handleMessage (event: MessageEvent) {
        for (const callback of this.#callbacks) {
            callback(event.data)
        }
    }

    send (data: string) {
        this.#ws.send(data)
    }

    on (event: string, callback: Callback) {
        if (event === 'open') {
            this.#ws.onopen = callback
        } else if (event === 'close') {
            this.#ws.onclose = callback
        } else if (event === 'error') {
            this.#ws.onerror = callback
        } else {
            this.#callbacks.add(callback)
        }

        return this
    }

    off (_event: string, callback: Callback) {
        this.#callbacks.delete(callback)
        return this
    }

    close () {
        this.#ws.close()
    }
}

type Callback = (data: unknown, reason?: unknown) => void
