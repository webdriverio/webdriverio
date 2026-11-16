import logger from '@wdio/logger'

import {
    DEFAULT_HOSTNAME, DEFAULT_PORT, DEFAULT_PROTOCOL, DEFAULT_REQUEST_TIMEOUT,
    INSTALL_HINT, RPC_ENDPOINT
} from './constants.js'
import type { Options } from './types.js'

const log = logger('@wdio/mobilecli-driver')

interface RpcResponse<T> {
    jsonrpc: '2.0'
    id: number | null
    result?: T
    error?: {
        code: number
        message: string
        data?: unknown
    }
}

/**
 * An error that the mobilecli server answered with. mobilecli uses the code
 * `-32000` for every failure on a device, the reason is in the message.
 */
export class RpcError extends Error {
    code: number
    method: string

    constructor (method: string, code: number, message: string) {
        super(message)
        this.name = 'mobilecli error'
        this.method = method
        this.code = code
    }
}

/**
 * The address of the JSON-RPC endpoint, from the connection options that
 * WebdriverIO already has: `protocol`, `hostname`, `port` and `path`.
 */
export function getServerUrl (options: Pick<Options, 'protocol' | 'hostname' | 'port' | 'path'> = {}) {
    const protocol = options.protocol || DEFAULT_PROTOCOL
    const hostname = options.hostname || DEFAULT_HOSTNAME
    const port = options.port || DEFAULT_PORT
    const path = `/${options.path || ''}/`.replace(/\/+/g, '/')
    return `${protocol}://${hostname}:${port}${path}${RPC_ENDPOINT}`
}

/**
 * JSON-RPC 2.0 client of the mobilecli server (`POST /rpc`)
 */
export class RpcClient {
    url: string
    timeout: number
    headers: Record<string, string>
    #id = 0

    /**
     * @param url      address of the JSON-RPC endpoint, see `getServerUrl`
     * @param timeout  how long one call may take, in ms
     * @param headers  headers for every request, e.g. the `Authorization` of
     *                 a proxy in front of the server (the `headers` option)
     */
    constructor (url: string, timeout = DEFAULT_REQUEST_TIMEOUT, headers: Record<string, string> = {}) {
        this.url = url
        this.timeout = timeout
        this.headers = headers
    }

    /**
     * Call a method of the server.
     * @param  method  name of the method, e.g. `device.info`
     * @param  params  parameters of the method
     * @return the `result` of the response
     * @throws an `RpcError` if the server answers with an error, an `Error`
     *         if the server can not be reached or does not answer in time
     */
    async call<T = unknown> (method: string, params: Record<string, unknown> = {}): Promise<T> {
        const id = ++this.#id
        log.debug('RPC', method, params)

        /**
         * the timeout is for the whole answer: a server can send the headers
         * and then stall on the body
         */
        let response: Response
        let text: string
        try {
            response = await fetch(this.url, {
                method: 'POST',
                headers: { ...this.headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
                signal: AbortSignal.timeout(this.timeout)
            })
            text = await response.text()
        } catch (err) {
            if (err instanceof Error && err.name === 'TimeoutError') {
                throw new Error(`The mobilecli server at ${this.url} did not answer "${method}" within ${this.timeout}ms`, { cause: err })
            }
            throw new Error(`Could not reach the mobilecli server at ${this.url}. ${INSTALL_HINT}`, { cause: err })
        }

        /**
         * Anything that is not a JSON-RPC response does not come from
         * mobilecli, e.g. the 502 of a proxy. mobilecli leaves `result` out
         * if a method returns nothing, so its absence is not an error.
         */
        const body = parseResponse<T>(text)
        if (!body || (!body.error && !response.ok)) {
            throw new Error(
                `The server at ${this.url} did not answer "${method}" with a JSON-RPC response (status ${response.status}). ` +
                'Is this a mobilecli server?' + (text ? ` Response: ${text.slice(0, 200)}` : '')
            )
        }

        if (body.error) {
            throw new RpcError(method, body.error.code, getErrorMessage(body.error))
        }

        log.debug('RPC RESULT', method, body.result)
        return body.result as T
    }
}

function parseResponse<T> (text: string): RpcResponse<T> | undefined {
    try {
        const body = JSON.parse(text)
        return body && body.jsonrpc === '2.0' ? body : undefined
    } catch {
        return undefined
    }
}

/**
 * mobilecli puts a generic text in `message` ("Server error") and the reason
 * in `data`
 */
function getErrorMessage (error: NonNullable<RpcResponse<unknown>['error']>) {
    if (typeof error.data === 'string' && error.data) {
        return error.data
    }
    if (error.data !== undefined && error.data !== null) {
        return `${error.message}: ${JSON.stringify(error.data)}`
    }
    return error.message
}
