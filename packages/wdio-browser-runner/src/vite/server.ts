import path from 'node:path'
import { EventEmitter } from 'node:events'

import getPort from 'get-port'
import logger from '@wdio/logger'
import { deepmerge } from 'deepmerge-ts'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import { serializeError } from 'serialize-error'
import { executeHooksWithArgs } from '@wdio/utils'
import type { ViteDevServer, InlineConfig, ConfigEnv } from 'vite'
import { createServer } from 'vite'
import istanbulPlugin from 'vite-plugin-istanbul'
import type { Services, Options } from '@wdio/types'

import { testrunner } from './plugins/testrunner.js'
import { mockHoisting } from './plugins/mockHoisting.js'
import { userfriendlyImport } from './utils.js'
import { MockHandler } from './mock.js'
import { PRESET_DEPENDENCIES, DEFAULT_VITE_CONFIG } from './constants.js'
import { MESSAGE_TYPES, DEFAULT_INCLUDE, DEFAULT_FILE_EXTENSIONS } from '../constants.js'
import type {
    ConsoleEvent, HookTriggerEvent, CommandRequestEvent, CommandResponseEvent, SocketMessage,
    HookResultEvent, SocketMessagePayload
} from './types.js'

import { BROWSER_POOL, SESSIONS } from '../constants.js'

const log = logger('@wdio/browser-runner:ViteServer')
const HOOK_TIMEOUT = 15 * 1000
const DEFAULT_CONFIG_ENV: ConfigEnv = {
    command: 'serve',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

interface PendingHook {
    hookExecutionTimeout: NodeJS.Timeout
    resolveFn: Function
}

export class ViteServer extends EventEmitter {
    #pendingHooks = new Map<string, PendingHook>()
    #connections = new Set<WebSocket>()
    #options: WebdriverIO.BrowserRunnerOptions
    #config: Options.Testrunner
    #viteConfig: Partial<InlineConfig>
    #wss?: WebSocketServer
    #server?: ViteDevServer
    #mockHandler: MockHandler

    get socketServer () {
        return this.#wss
    }

    get config () {
        return this.#viteConfig
    }

    constructor (options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner) {
        super()
        this.#options = options
        this.#config = config
        this.#mockHandler = new MockHandler(options, config)
        this.#viteConfig = deepmerge(DEFAULT_VITE_CONFIG, {
            root: options.rootDir || process.cwd(),
            plugins: [
                testrunner(options),
                mockHoisting(this.#mockHandler)
            ]
        })

        if (options.coverage && options.coverage.enabled) {
            log.info('Capturing test coverage enabled')
            this.#viteConfig.plugins?.push(istanbulPlugin({
                cwd: config.rootDir,
                include: DEFAULT_INCLUDE,
                extension: DEFAULT_FILE_EXTENSIONS,
                forceBuildInstrument: true,
                ...options.coverage
            }))
        }
    }

    async start () {
        const [vitePort, wssPort] = await Promise.all([getPort(), getPort()])
        this.#viteConfig = deepmerge(this.#viteConfig, <Partial<InlineConfig>>{
            server: {
                host: '0.0.0.0',
                port: vitePort,
                proxy: {
                    '/ws': {
                        target: `ws://localhost:${wssPort}`,
                        ws: true
                    }
                }
            }
        })

        /**
         * load additional Vite plugins for framework
         */
        if (this.#options.preset) {
            const [pkg, importProp, opts] = PRESET_DEPENDENCIES[this.#options.preset] || []
            const plugin = (await userfriendlyImport(this.#options.preset, pkg))[importProp || 'default']
            if (plugin) {
                this.#viteConfig.plugins!.push(plugin(opts))
            }
        }

        /**
         * merge custom `viteConfig` last into the object
         */
        if (this.#options.viteConfig) {
            const configToMerge = typeof this.#options.viteConfig === 'string'
                ? (
                    await import(path.resolve(this.#config.rootDir || process.cwd(), this.#options.viteConfig))
                ).default
                : typeof this.#options.viteConfig === 'function'
                    ? await this.#options.viteConfig(DEFAULT_CONFIG_ENV)
                    : this.#options.viteConfig
            this.#viteConfig = deepmerge(this.#viteConfig, configToMerge)
        }

        /**
         * initialize Socket server on top of vite server
         */
        this.#wss = new WebSocketServer({ port: wssPort })
        this.#wss.on('connection', this.#onConnect.bind(this))

        /**
         * initialize Vite
         */
        this.#server = await createServer(this.#viteConfig)
        await this.#server.listen()
        log.info(`Vite server started successfully on port ${vitePort}, root directory: ${this.#viteConfig.root}`)
    }

    async close () {
        for (const conn of this.#connections) {
            conn.close()
        }
        await this.#server?.close()
    }

    #onConnect (ws: WebSocket) {
        this.#connections.add(ws)
        ws.on('message', this.#onMessage(ws))
    }

    #onMessage (ws: WebSocket) {
        return (data: Buffer) => {
            try {
                const payload: SocketMessage = JSON.parse(data.toString())
                if (payload.type === MESSAGE_TYPES.consoleMessage) {
                    return this.#handleConsole(payload.value)
                }
                if (payload.type === MESSAGE_TYPES.hookTriggerMessage) {
                    return this.#handleHook(ws, payload.value)
                }
                if (payload.type === MESSAGE_TYPES.commandRequestMessage) {
                    return this.#handleCommand(ws, payload.value)
                }
                if (payload.type === MESSAGE_TYPES.mockRequest) {
                    this.#mockHandler.addMock(payload.value)
                    return ws.send(JSON.stringify(<SocketMessagePayload<MESSAGE_TYPES.mockResponse>>{
                        type: MESSAGE_TYPES.mockResponse,
                        value: payload.value
                    }))
                }

                throw new Error(`Unknown socket message ${JSON.stringify(payload)}`)
            } catch (err: any) {
                const error = `Failed handling socket message: ${err.message}`
                log.error(error)
                return ws.send(JSON.stringify(error))
            }
        }
    }

    #handleConsole (message: ConsoleEvent) {
        const isWDIOLog = Boolean(typeof message.args[0] === 'string' && message.args[0].startsWith('[WDIO]') && message.type !== 'error')
        if (message.name !== 'consoleEvent' || isWDIOLog) {
            return
        }
        console[message.type](`[${message.cid}]`, ...(message.args || []))
    }

    async #handleHook (ws: WebSocket, payload: HookTriggerEvent) {
        const session = SESSIONS.get(payload.cid)
        if (!session) {
            const error = serializeError(new Error(`No session for cid ${payload.cid} found!`))
            return ws.send(JSON.stringify(this.#hookResponse({ ...payload, error })))
        }

        const result: HookResultEvent = await Promise.all([
            /**
             * run config file hooks
             */
            executeHooksWithArgs(payload.name, session.config[payload.name as keyof Services.HookFunctions], payload.args).then(
                () => payload,
                (error: Error) => ({ ...payload, error: serializeError(error) })
            ),
            /**
             * run service hooks in worker process
             */
            this.runWorkerHooks(payload).catch((error: Error) => ({ ...payload, error: serializeError(error) }))
        ]).then(
            /**
             * we don't propagate hook results from worker executions back
             * as it doesn't seem to be necessary or relevant
             */
            ([result]) => result
        )

        return ws.send(JSON.stringify(this.#hookResponse(result)))
    }

    async #handleCommand (ws: WebSocket, payload: CommandRequestEvent) {
        log.debug(`Received browser message: ${JSON.stringify(payload)}`)
        const cid = payload.cid
        if (typeof cid !== 'string') {
            const error = serializeError(new Error(`No "cid" property passed into command message with id "${payload.id}"`))
            return ws.send(JSON.stringify(this.#commandResponse({ id: payload.id, error })))
        }

        const browser = await BROWSER_POOL.get(payload.cid) as WebdriverIO.Browser | undefined
        if (!browser) {
            const error = serializeError(new Error(`Couldn't find browser with cid "${payload.cid}"`))
            return ws.send(JSON.stringify(this.#commandResponse({ id: payload.id, error })))
        }
        try {
            /**
             * emit debug state to be enabled to runner so it can be propagated to the worker
             */
            if (payload.commandName === 'debug') {
                this.emit('debugState', true)
            }

            /**
             * double check if function is registered
             */
            if (typeof browser[payload.commandName as keyof typeof browser] !== 'function') {
                throw new Error(`browser.${payload.commandName} is not a function`)
            }

            const result = await (browser[payload.commandName as keyof typeof browser] as Function)(...payload.args)
            const resultMsg = JSON.stringify(this.#commandResponse({ id: payload.id, result }))

            /**
             * emit debug state to be disabled to runner so it can be propagated to the worker
             */
            if (payload.commandName === 'debug') {
                this.emit('debugState', false)
            }

            log.info(`Return command result: ${resultMsg}`)
            return ws.send(resultMsg)
        } catch (error: any) {
            return ws.send(JSON.stringify(this.#commandResponse({
                id: payload.id,
                error: serializeError(new Error(`Failed to execute command "${payload.commandName}": ${error.message}`))
            })))
        }
    }

    #commandResponse (value: CommandResponseEvent): SocketMessage {
        return {
            type: MESSAGE_TYPES.commandResponseMessage,
            value
        }
    }

    #hookResponse (value: HookResultEvent): SocketMessage {
        return {
            type: MESSAGE_TYPES.hookResultMessage,
            value
        }
    }

    #getPendingHookId (payload: HookTriggerEvent) {
        return `${payload.cid}-${payload.id}`
    }

    private runWorkerHooks (payload: HookTriggerEvent) {
        const hookId = this.#getPendingHookId(payload)
        if (this.#pendingHooks.has(hookId)) {
            throw new Error(`There is still a hook running for runner with id ${hookId}`)
        }

        this.emit('workerHookExecution', payload)
        return new Promise((resolve, reject) => {
            const hookExecutionTimeout = setTimeout(
                () => reject(new Error(`hook execution for runner with id ${hookId} timed out`)),
                HOOK_TIMEOUT)
            this.#pendingHooks.set(hookId, { hookExecutionTimeout, resolveFn: resolve })
        })
    }

    resolveHook (result: HookTriggerEvent) {
        const hookId = this.#getPendingHookId(result)
        const pendingHook = this.#pendingHooks.get(hookId)
        if (!pendingHook) {
            return log.warn(`Tried to resolve hook for cid ${result.cid} with id ${result.id} that didn't exist`)
        }

        pendingHook.resolveFn()
        this.#pendingHooks.delete(hookId)
    }
}
