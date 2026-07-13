import libSourceMap from 'istanbul-lib-source-maps'
import libCoverage, { type CoverageMap, type CoverageMapData } from 'istanbul-lib-coverage'

import logger from '@wdio/logger'
import type { WebSocketClient } from 'vite'
import type { WorkerInstance } from '@wdio/local-runner'
import type { AnyWSMessage, IPCMessageValue, IPC_MESSAGE_TYPES, WSMessage } from '@wdio/types'
import { WS_MESSAGE_TYPES } from '@wdio/types'

import { SESSIONS } from './constants.js'
import { WDIO_EVENT_NAME } from './constants.js'
import type { ViteServer } from './vite/server.js'
import { isWSMessage } from '@wdio/utils'

const log = logger('@wdio/browser-runner')

interface WorkerMessage {
    id: number
    client: WebSocketClient
}

export class ServerWorkerCommunicator {
    #mapStore = libSourceMap.createSourceMapStore()
    #config: WebdriverIO.Config
    #msgId = 0

    /**
     * keep track of custom commands per session
     */
    #customCommands = new Map<string, Set<string>>()

    /**
     * keep track of request/response messages on browser/worker level
     */
    #pendingMessages = new Map<number, WorkerMessage>()

    public coverageMaps: CoverageMap[] = []

    constructor (config: WebdriverIO.Config) {
        this.#config = config
    }

    register (server: ViteServer, worker: WorkerInstance) {
        const { cid } = worker
        server.onBrowserEvent((data, client) => this.#onBrowserEvent(data, client, worker))

        /**
         * register browser-runner handlers on the worker's single parent-side
         * RPC server instead of creating a second `createServerRpc`. The disposer
         * is kept in a per-`register` closure so each worker owns its own
         * unregister callback; a class field would be overwritten when more than
         * one worker is registered on the same communicator, letting one worker's
         * `sessionEnded` unregister another worker's handlers. It is held on a
         * const wrapper because `sessionEnded` reads it before
         * `registerBrowserRunnerRpcHandlers` returns.
         */
        const handle: { unregister?: () => void } = {}
        handle.unregister = worker.registerBrowserRunnerRpcHandlers({
            sessionMetadata: (data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionMetadataMessage]) => {
                if (!SESSIONS.has(cid)) {
                    SESSIONS.set(cid, {
                        args: this.#config.mochaOpts || {},
                        config: this.#config,
                        capabilities: data.capabilities,
                        sessionId: data.sessionId,
                        injectGlobals: data.injectGlobals
                    })
                }
            },
            sessionEnded: () => {
                handle.unregister?.()
                SESSIONS.delete(cid)
                this.#customCommands.delete(cid)
            },
            workerEvent: async ({ args }) => {
                if (isWSMessage(args, WS_MESSAGE_TYPES.coverageMap)) {
                    const coverageMapData = args.value as CoverageMapData
                    this.coverageMaps.push(
                        await this.#mapStore.transformCoverage(libCoverage.createCoverageMap(coverageMapData))
                    )
                }

                if (isWSMessage(args, WS_MESSAGE_TYPES.customCommand)) {
                    const customArgs = args as WSMessage<WS_MESSAGE_TYPES.customCommand>
                    const { commandName, cid: commandCid } = customArgs.value
                    if (!this.#customCommands.has(commandCid)) {
                        this.#customCommands.set(commandCid, new Set())
                    }
                    this.#customCommands.get(commandCid)!.add(commandName)
                }
            },
            workerResponse: ({ args }) => {
                const { id, message } = args
                const msg = this.#pendingMessages.get(id)
                if (!msg) {
                    return log.error(`Couldn't find message with id ${id} from type ${message.type}`)
                }
                this.#pendingMessages.delete(id)
                msg.client.send(WDIO_EVENT_NAME, message)
            }
        })
    }

    #onBrowserEvent (message: AnyWSMessage, client: WebSocketClient, worker: WorkerInstance) {
        /**
         * browser state requests are answered directly by the parent process
         */
        if (isWSMessage(message, WS_MESSAGE_TYPES.initiateBrowserStateRequest)) {
            const result: AnyWSMessage = {
                type: WS_MESSAGE_TYPES.initiateBrowserStateResponse,
                value: {
                    customCommands: [...(this.#customCommands.get(message.value.cid) || [])]
                }
            }
            return client.send(WDIO_EVENT_NAME, result)
        }

        /**
         * fire-and-forget browser events that do not expect a worker response.
         * Forwarded through the worker's single RPC proxy.
         */
        if (isWSMessage(message, WS_MESSAGE_TYPES.consoleMessage)) {
            return worker.sendConsoleMessage(message.value)
        }
        if (isWSMessage(message, WS_MESSAGE_TYPES.browserTestResult)) {
            return worker.sendBrowserTestResult(message.value)
        }

        /**
         * request/response browser events (command, hook, expect and
         * expect-matchers requests). We assign a communicator-level correlation
         * `id` (separate from the browser payload id) and store the originating
         * client so the matching `workerResponse` can be routed back to it.
         */
        const id = this.#msgId++
        this.#pendingMessages.set(id, { id, client })
        return worker.sendWorkerRequest({ id, message })
    }
}
