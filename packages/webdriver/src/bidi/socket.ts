/**
 * A WebSocket implementation that wraps the browser native WebSocket
 * interface and exposes a similar interface to the Node.js WebSocket
 */
class BrowserSocket {
    #callbacks = new Set<any>()
    #ws: WebSocket

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor (wsUrl: string, opts: any) {
        this.#ws = new globalThis.WebSocket(wsUrl) as any
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

    on (event: string, callback: (data: any, reason?: any) => void) {
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

    off (event: string, callback: (data: any, reason?: any) => void) {
        this.#callbacks.delete(callback)
        return this
    }

    close () {
        this.#ws.close()
    }
}

/**
 * make sure to use the correct WebSocket implementation based on the environment
 */
export default globalThis.WebSocket
    ? BrowserSocket
    : (await import('ws')).default
