import libSourceMap from 'istanbul-lib-source-maps'
import libCoverage, { type CoverageMap, type CoverageMapData } from 'istanbul-lib-coverage'

import logger from '@wdio/logger'
import type { WebSocketClient } from 'vite'
import type { WorkerInstance } from '@wdio/local-runner'
import type { AnyWSMessage, IPC_MESSAGE_TYPES, IPCMessageValue, Workers, WSMessage } from '@wdio/types'
import { WS_MESSAGE_TYPES } from '@wdio/types'

import { SESSIONS } from './constants.js'
import { WDIO_EVENT_NAME } from './constants.js'
import type { ViteServer } from './vite/server.js'
import { isWSMessage } from '@wdio/utils'

const log = logger('@wdio/browser-runner')
import { createServerRpc } from '@wdio/rpc'
import type { ServerFunctions, ClientFunctions } from '@wdio/rpc'

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
        server.onBrowserEvent((data, client) => this.#onBrowserEvent(data, client, worker))
        createServerRpc<ClientFunctions, ServerFunctions>({
            sessionStarted: (data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionStartedMessage]) => {
                const cid = data.cid
                if (typeof cid !== 'string') {
                    return log.error('Received sessionStarted without a valid cid')
                }

                if (!SESSIONS.has(cid)) {
                    SESSIONS.set(cid, {
                        args: this.#config.mochaOpts || {},
                        config: this.#config,
                        capabilities: data.content.capabilities,
                        sessionId: data.content.sessionId,
                        injectGlobals: data.content.injectGlobals
                    })
                }
            },
            sessionEnded: (data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionEnded]) => {
                SESSIONS.delete(data.cid)
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
                    const { commandName, cid } = customArgs.value
                    if (!this.#customCommands.has(cid)) {
                        this.#customCommands.set(cid, new Set())
                    }
                    const customCommands = this.#customCommands.get(cid)!
                    customCommands.add(commandName)
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
            },
            snapshotResults: () => {},
            printFailureMessage: () => {},
            testFrameworkInitMessage: () => {},
            errorMessage: () => {}
        })
    }

    #onBrowserEvent (message: AnyWSMessage, client: WebSocketClient, worker: WorkerInstance) {
        if (isWSMessage(message, WS_MESSAGE_TYPES.initiateBrowserStateRequest)) {
            const result: AnyWSMessage = {
                type: WS_MESSAGE_TYPES.initiateBrowserStateResponse,
                value: {
                    customCommands: [...(this.#customCommands.get(message.value.cid) || [])]
                }
            }
            return client.send(WDIO_EVENT_NAME, result)
        }

        const id = this.#msgId++
        const msg: WorkerMessage = { id, client }
        this.#pendingMessages.set(id, msg)
        const args: Workers.WorkerRequest['args'] = { id, message }
        return worker.postMessage('workerRequest', args as unknown as Workers.WorkerMessageArgs, true)
    }
}
