import logger, { SENSITIVE_DATA_REPLACER } from '@wdio/logger'
import type { ClientOptions, RawData, WebSocket } from 'ws'

import { environment } from '../environment.js'
import type * as remote from './remoteTypes.js'
import type * as local from './localTypes.js'
import type { CommandData } from './remoteTypes.js'
import type { CommandResponse, ErrorResponse } from './localTypes.js'

import type { Client } from '../types.js'
import { isBase64Safe } from './utils.js'
import { DEFAULT_RESPONSE_TIMEOUT, SESSION_ENDED_ERROR } from '../constants.js'

const SCRIPT_PREFIX = '/* __wdio script__ */'
const SCRIPT_SUFFIX = '/* __wdio script end__ */'

const log = logger('webdriver')

/**
 * Set this symbol on a command's `params` to keep its values out of logs and
 * `bidiCommand` events, e.g. text typed with `setValue(value, { mask: true })`.
 * `JSON.stringify` skips symbol keys, so the command is sent unchanged.
 */
export const BIDI_MASK = Symbol.for('wdio.bidi.mask')

/**
 * Set this symbol on a command's `params` to a number of milliseconds: `send`
 * rejects with a `script timeout` error when the browser does not answer within
 * that time. WebDriver BiDi has no script timeout
 * (https://github.com/w3c/webdriver-bidi/issues/199), so `execute` sets the
 * session's `script` timeout here. The time starts when the command is sent,
 * so command hooks do not count. Like `BIDI_MASK`, it is not sent.
 */
export const BIDI_SCRIPT_TIMEOUT = Symbol.for('wdio.bidi.scriptTimeout')

/**
 * The longest delay `setTimeout` accepts: Node.js and browsers keep it in a
 * 32-bit signed integer. A longer delay fires after 1 ms (Node.js prints a
 * `TimeoutOverflowWarning`), so a longer script timeout means no limit.
 */
const MAX_TIMER_DELAY = 2 ** 31 - 1

/**
 * how many timed out commands `BidiCore` remembers to ignore their late result;
 * a script that never settles never answers, so the oldest ids are dropped
 */
export const MAX_EXPIRED_COMMANDS = 1000

/**
 * a command that waits for its result
 */
interface PendingCommand {
    resolve: (payload: CommandResponse) => void
    /**
     * reject with why the command gets no result
     */
    reject: (reason: string) => void
}

export class BidiCore {
    #id = 0
    #ws: WebSocket | undefined
    #waitForConnected: Promise<boolean>
    #resolveWaitForConnected: (value: boolean) => void
    #webSocketUrl: string
    #clientOptions: ClientOptions | undefined
    #responseTimeout: number
    #connectTimeout: number | undefined
    #pendingCommands: Map<number, PendingCommand> = new Map()
    /**
     * the socket listeners, kept to remove them again in `close()`
     */
    #onMessage = this.#handleResponse.bind(this)
    #onClose?: (code?: number) => void
    /**
     * commands that ran out of their script timeout: their late result is ignored
     */
    #expiredCommands = new Set<number>()

    client: Client | undefined
    /**
     * @private
     */
    private _isConnected = false
    /**
     * the connection was open and is closed now (not: it never connected)
     */
    #closed = false

    constructor (
        webSocketUrl: string,
        opts?: ClientOptions,
        responseTimeout = DEFAULT_RESPONSE_TIMEOUT,
        connectTimeout?: number
    ) {
        if (!Number.isFinite(responseTimeout) || responseTimeout <= 0) {
            throw new TypeError('The option "bidiResponseTimeout" needs to be a positive number')
        }
        if (connectTimeout !== undefined && (!Number.isFinite(connectTimeout) || connectTimeout <= 0)) {
            throw new TypeError('The option "bidiConnectTimeout" needs to be a positive number')
        }

        this.#webSocketUrl = webSocketUrl
        this.#clientOptions = opts
        this.#responseTimeout = responseTimeout
        this.#connectTimeout = connectTimeout
        this.#resolveWaitForConnected = () => {}
        this.#waitForConnected = new Promise((resolve) => {
            this.#resolveWaitForConnected = resolve
        })
    }

    /**
     * We initiate the Bidi instance before a WebdriverIO instance is created.
     * In order to emit Bidi events we have to attach the WebdriverIO instance
     * to the Bidi instance afterwards.
     */
    public attachClient (client: Client) {
        this.client = client
    }

    public async connect () {
        log.info(`Connecting to webSocketUrl ${this.#webSocketUrl}`)
        this.#closed = false

        /**
         * try to connect to different websocket urls depending on the protocol
         */
        try {
            this.#ws = await environment.value.createBidiConnection(this.#webSocketUrl, this.#clientOptions, this.#connectTimeout)
        } catch (err) {
            /**
             * e.g. an invalid url: `waitForConnected()` must not wait forever
             */
            this.#resolveWaitForConnected(false)
            throw err
        }
        this._isConnected = Boolean(this.#ws)
        this.#resolveWaitForConnected(this._isConnected)

        const ws = this.#ws
        if (ws) {
            ws.on('message', this.#onMessage)
            /**
             * only the socket of this connection: after `reconnect()`, the old socket
             * can still send its close event
             */
            this.#onClose = (code?: number) => {
                if (this.#ws === ws) {
                    this.#handleClose(code)
                }
            }
            ws.on('close', this.#onClose)
        }

        return this._isConnected
    }

    public close () {
        if (!this._isConnected) {
            return
        }

        log.info(`Close Bidi connection to ${this.#webSocketUrl}`)
        this._isConnected = false
        this.#closed = true
        this.#expiredCommands.clear()
        /**
         * first: the socket teardown below can throw
         */
        this.#rejectPendingCommands('the connection was closed')
        const ws = this.#ws
        this.#ws = undefined
        if (ws) {
            ws.off('message', this.#onMessage)
            if (this.#onClose) {
                ws.off('close', this.#onClose)
            }
            ws.close()
            /**
             * the `BrowserSocket` of the browser build has no `terminate()`
             */
            if (typeof ws.terminate === 'function') {
                ws.terminate()
            }
        }
    }

    /**
     * Close a connection that can not serve the session: the handler is then in the
     * state of a connection that could not be made, so the session does not count as ended
     */
    public discard () {
        const wasConnected = this._isConnected
        this.close()
        /**
         * a socket that the server closed before stays closed: the session ended
         */
        if (wasConnected) {
            this.#closed = false
        }
    }

    /**
     * The browser or the driver closed the socket (for example a browser crash, a
     * cloud timeout or a lost network): no pending command can get a result anymore.
     */
    #handleClose (code?: number) {
        log.info(`Bidi connection to ${this.#webSocketUrl} closed${typeof code === 'number' ? ` (code ${code})` : ''}`)
        this._isConnected = false
        this.#closed = true
        this.#expiredCommands.clear()
        this.#ws = undefined
        this.#rejectPendingCommands(
            `the browser or the driver closed the connection${typeof code === 'number' ? ` (code ${code})` : ''}`
        )
    }

    /**
     * Reject the pending commands at once: without a connection, they would wait
     * for `bidiResponseTimeout` and then fail with a misleading timeout error.
     */
    #rejectPendingCommands (reason: string) {
        const pending = [...this.#pendingCommands.values()]
        this.#pendingCommands.clear()
        for (const command of pending) {
            command.reject(reason)
        }
    }

    public reconnect (webSocketUrl: string, opts?: ClientOptions) {
        log.info(`Reconnect to new Bidi session at ${webSocketUrl}`)
        this.close()
        this.#webSocketUrl = webSocketUrl
        this.#clientOptions = opts
        return this.connect()
    }

    /**
     * Helper function that allows to wait until Bidi connection establishes
     * @returns a promise that resolves once the connection to WebDriver Bidi protocol was established
     */
    waitForConnected () {
        return this.#waitForConnected
    }

    get socket () {
        return this.#ws
    }

    get isConnected () {
        return this._isConnected
    }

    /**
     * `true` when the connection was open and is closed now: after `close()` (e.g. by
     * `deleteSession`), or when the browser or the driver closed the socket. `false` before
     * the first connection and when the connection could not be made.
     */
    get isClosed () {
        return this.#closed
    }

    #handleResponse (data: RawData) {
        try {
            const payload = JSON.parse(data.toString()) as CommandResponse
            if (!payload.id) {
                return
            }

            /**
             * If the result is a base64 encoded string, we want to log a simplified version
             * of the result instead of the raw base64 encoded string
             */
            let resultLog = data.toString()
            if (typeof payload.result === 'object' && payload.result && 'data' in payload.result && typeof payload.result.data === 'string' && isBase64Safe(payload.result.data)) {
                resultLog = JSON.stringify({
                    ...payload.result,
                    data: `Base64 string [${payload.result.data.length} chars]`
                })
            }

            log.info('BIDI RESULT', resultLog)
            this.client?.emit('bidiResult', payload)
            const command = this.#pendingCommands.get(payload.id)
            if (!command) {
                if (this.#expiredCommands.delete(payload.id)) {
                    log.debug(`Ignore the result of command with id ${payload.id}, it ran out of its script timeout`)
                    return
                }
                log.error(`Couldn't resolve command with id ${payload.id}`)
                return
            }

            this.#pendingCommands.delete(payload.id)
            command.resolve(payload)
        } catch (err) {
            const error = err instanceof Error ? err : new Error(`Failed parse message: ${String(err)}`)
            log.error(`Failed parse message: ${error.message}`)
        }
    }

    public async send (params: Omit<CommandData, 'id'>): Promise<CommandResponse> {
        const id = this.sendAsync(params)
        const failError = new Error(`WebDriver Bidi command "${params.method}" failed`)
        const scriptTimeout = (params.params as unknown as Record<symbol, unknown> | undefined)?.[BIDI_SCRIPT_TIMEOUT]
        const payload = await new Promise<CommandResponse | ErrorResponse>((resolve, reject) => {
            const t = setTimeout(() => {
                clearTimeout(scriptTimer)
                reject(new Error(
                    `Command ${params.method} with id ${id} timed out after ${this.#responseTimeout}ms! ` +
                    'Consider increasing the "bidiResponseTimeout" option.'
                ))
                this.#pendingCommands.delete(id)
            }, this.#responseTimeout)
            const scriptTimer = typeof scriptTimeout === 'number' && scriptTimeout >= 0 && scriptTimeout <= MAX_TIMER_DELAY
                ? setTimeout(() => {
                    clearTimeout(t)
                    const error = new Error(
                        `script timeout: the script did not finish within ${scriptTimeout}ms. ` +
                        'Set a longer "script" timeout with `browser.setTimeout({ script })` if it needs more time.'
                    )
                    error.name = 'script timeout'
                    reject(error)
                    this.#pendingCommands.delete(id)
                    if (this.#expiredCommands.size >= MAX_EXPIRED_COMMANDS) {
                        this.#expiredCommands.delete(this.#expiredCommands.values().next().value!)
                    }
                    this.#expiredCommands.add(id)
                }, scriptTimeout)
                : undefined
            this.#pendingCommands.set(id, {
                resolve: (payload) => {
                    clearTimeout(t)
                    clearTimeout(scriptTimer)
                    resolve(payload)
                },
                /**
                 * `failError` has the stack of the line that sent the command
                 */
                reject: (reason) => {
                    clearTimeout(t)
                    clearTimeout(scriptTimer)
                    failError.message = `WebDriver Bidi command "${params.method}" with id ${id} got no result: ${reason}`
                    failError.name = SESSION_ENDED_ERROR
                    reject(failError)
                }
            })
        })

        if (payload.type === 'error' || 'error' in payload) {
            const error = payload as local.ErrorResponse
            failError.message += ` with error: ${payload.error} - ${error.message}`
            if (error.stacktrace && typeof error.stacktrace === 'string') {
                const driverStack = error.stacktrace
                    .split('\n')
                    .filter(Boolean)
                    .map((line: string) => `    at ${line}`)
                    .join('\n')
                failError.stack += `\n\nDriver Stack:\n${driverStack}`
            }

            throw failError
        }

        return payload
    }

    public sendAsync (params: Omit<CommandData, 'id'>) {
        if (!this.#ws || !this._isConnected) {
            const error = new Error('No connection to WebDriver Bidi was established')
            /**
             * the connection was open: the session ended
             */
            if (this.#closed) {
                error.name = SESSION_ENDED_ERROR
            }
            throw error
        }

        const logged = maskBidiCommand(params)
        log.info('BIDI COMMAND', ...parseBidiCommand(logged))
        const id = ++this.#id
        this.client?.emit('bidiCommand', { ...logged, id })
        this.#ws.send(JSON.stringify({ id, ...params }))
        return id
    }
}

/**
 * A copy of the command to log when its params carry `BIDI_MASK`. Key action
 * values are replaced, so the log still shows the shape of the input.
 * Any other masked command hides all of its params.
 */
export function maskBidiCommand (params: Omit<CommandData, 'id'>): Omit<CommandData, 'id'> {
    const raw = params.params as unknown as Record<symbol, unknown> | undefined
    if (!raw || !raw[BIDI_MASK]) {
        return params
    }
    if (params.method === 'input.performActions') {
        const param = params.params as remote.InputPerformActionsParameters
        return {
            ...params,
            params: {
                ...param,
                actions: param.actions.map((source) => source.type !== 'key' ? source : {
                    ...source,
                    actions: source.actions.map((action) => 'value' in action
                        ? { ...action, value: SENSITIVE_DATA_REPLACER }
                        : action)
                })
            }
        } as Omit<CommandData, 'id'>
    }
    return { ...params, params: SENSITIVE_DATA_REPLACER } as unknown as Omit<CommandData, 'id'>
}

export function parseBidiCommand (params:  Omit<CommandData, 'id'>) {
    const commandName = params.method
    if (commandName === 'script.addPreloadScript') {
        const param = params.params as remote.ScriptAddPreloadScriptParameters
        const logString = `{ functionDeclaration: <PreloadScript[${new TextEncoder().encode(param.functionDeclaration).length} bytes]>, contexts: ${JSON.stringify(param.contexts)} }`
        return [commandName, logString]
    } else if (commandName === 'script.callFunction') {
        const param = params.params as remote.ScriptCallFunctionParameters
        const fn = param.functionDeclaration
        let fnName = ''

        /**
         * extract function name from script when it's a function call from the 'webdriverio' package
         */
        if (fn.includes(SCRIPT_PREFIX)) {
            const internalFn = fn.slice(
                fn.indexOf(SCRIPT_PREFIX) + SCRIPT_PREFIX.length,
                fn.indexOf(SCRIPT_SUFFIX)
            )
            const functionPrefix = 'function '

            /**
             * we can only extract function name if it's a named function
             */
            if (internalFn.startsWith(functionPrefix)) {
                fnName = internalFn.slice(
                    internalFn.indexOf(functionPrefix) + functionPrefix.length,
                    internalFn.indexOf('(')
                )
            }
        }

        const logString = JSON.stringify({
            ...param,
            functionDeclaration: `<Function[${new TextEncoder().encode(param.functionDeclaration).length} bytes] ${fnName || 'anonymous'}>`
        })
        return [commandName, logString]
    }

    return [commandName, JSON.stringify(params.params)]
}
