import libSourceMap from 'istanbul-lib-source-maps'
import libCoverage, { type CoverageMap, type CoverageMapData } from 'istanbul-lib-coverage'

import logger from '@wdio/logger'
import type { WebSocketClient } from 'vite'
import type { WorkerInstance } from '@wdio/local-runner'
import { MESSAGE_TYPES, type Options, type Workers } from '@wdio/types'
import type { SessionStartedMessage, SessionEndedMessage, WorkerResponseMessage } from '@wdio/runner'

import { SESSIONS } from './constants.js'
import { WDIO_EVENT_NAME } from './constants.js'
import type { ViteServer } from './vite/server.js'

const log = logger('@wdio/browser-runner')

type WorkerMessagePayload = SessionStartedMessage | SessionEndedMessage | WorkerResponseMessage | Workers.WorkerEvent

interface WorkerMessage {
    id: number
    client: WebSocketClient
}

export class ServerWorkerCommunicator {
    #mapStore = libSourceMap.createSourceMapStore()
    #config: Options.Testrunner
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

    constructor (config: Options.Testrunner) {
        this.#config = config
    }

    register (server: ViteServer, worker: WorkerInstance) {
        server.onBrowserEvent((data, client) => this.#onBrowserEvent(data, client, worker))
        worker.on('message', this.#onWorkerMessage.bind(this))
    }

    async #onWorkerMessage (payload: WorkerMessagePayload) {
        if (payload.name === 'sessionStarted' && !SESSIONS.has(payload.cid!)) {
            SESSIONS.set(payload.cid!, {
                args: this.#config.mochaOpts || {},
                config: this.#config,
                capabilities: payload.content.capabilities,
                sessionId: payload.content.sessionId,
                injectGlobals: payload.content.injectGlobals
            })
        }

        if (payload.name === 'sessionEnded') {
            SESSIONS.delete(payload.cid)
        }

        if (payload.name === 'workerEvent' && payload.args.type === MESSAGE_TYPES.coverageMap) {
            const coverageMapData = payload.args.value as CoverageMapData
            this.coverageMaps.push(
                await this.#mapStore.transformCoverage(libCoverage.createCoverageMap(coverageMapData))
            )
        }

        if (payload.name === 'workerEvent' && payload.args.type === MESSAGE_TYPES.customCommand) {
            const { commandName, cid } = payload.args.value
            if (!this.#customCommands.has(cid)) {
                this.#customCommands.set(cid, new Set())
            }
            const customCommands = this.#customCommands.get(cid) || new Set()
            customCommands.add(commandName)
            return
        }

        if (payload.name === 'workerResponse') {
            const msg = this.#pendingMessages.get(payload.args.id)
            if (!msg) {
                return log.error(`Couldn't find message with id ${payload.args.id} from type ${payload.args.message.type}`)
            }
            this.#pendingMessages.delete(payload.args.id)
            return msg.client.send(WDIO_EVENT_NAME, payload.args.message)
        }
    }

    #onBrowserEvent (message: Workers.SocketMessage, client: WebSocketClient, worker: WorkerInstance) {
        /**
         * some browser events don't need to go through the worker process
         */
        if (message.type === MESSAGE_TYPES.initiateBrowserStateRequest) {
            const result: Workers.SocketMessage = {
                type: MESSAGE_TYPES.initiateBrowserStateResponse,
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
        return worker.postMessage('workerRequest', args, true)
    }
}
