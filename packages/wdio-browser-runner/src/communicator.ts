import libSourceMap from 'istanbul-lib-source-maps'
import libCoverage, { type CoverageMap, type CoverageMapData } from 'istanbul-lib-coverage'

import logger from '@wdio/logger'
import type { WebSocketClient } from 'vite'
import type { WorkerInstance } from '@wdio/local-runner'
import {
    MESSAGE_TYPES,
    browserChannelMessage,
    isWorkerProcessEvent,
    routeBrowserToRunnerMessage,
    parseRunnerToBrowserMessage,
    type Workers,
} from '@wdio/types'
import type { SessionStartedMessage, SessionEndedMessage, WorkerResponseMessage } from '@wdio/runner'

import { SESSIONS } from './constants.js'
import { WDIO_EVENT_NAME } from './constants.js'
import type { ViteServer } from './vite/server.js'

const log = logger('@wdio/browser-runner')

type WorkerMessagePayload = SessionStartedMessage | SessionEndedMessage | WorkerResponseMessage | Workers.WorkerEvent

interface PendingWorkerMessage {
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
     * request/response messages waiting for a worker reply, keyed by the
     * communicator routing id (not the id inside the browser payload)
     */
    #pendingMessages = new Map<number, PendingWorkerMessage>()

    public coverageMaps: CoverageMap[] = []

    constructor (config: WebdriverIO.Config) {
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
            this.#customCommands.delete(payload.cid)
        }

        if (payload.name === 'workerEvent' && isWorkerProcessEvent(payload.args, MESSAGE_TYPES.coverageMap)) {
            const coverageMapData = (payload.args.value ?? {}) as CoverageMapData
            this.coverageMaps.push(
                await this.#mapStore.transformCoverage(libCoverage.createCoverageMap(coverageMapData))
            )
        }

        if (payload.name === 'workerEvent' && isWorkerProcessEvent(payload.args, MESSAGE_TYPES.customCommand)) {
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
                return log.error(`Couldn't find message with id ${payload.args.id} from type ${payload.args.message?.type}`)
            }
            const message = parseRunnerToBrowserMessage(payload.args.message)
            if (!message) {
                this.#pendingMessages.delete(payload.args.id)
                return log.error(`Worker response ${payload.args.id} is not a runner → browser message`)
            }
            this.#pendingMessages.delete(payload.args.id)
            return msg.client.send(WDIO_EVENT_NAME, message)
        }
    }

    #onBrowserEvent (data: unknown, client: WebSocketClient, worker: WorkerInstance) {
        const route = routeBrowserToRunnerMessage(data)

        /**
         * browser state is answered by the parent process, which already knows
         * the custom commands registered for this session
         */
        if (route.kind === 'browserState') {
            const result = browserChannelMessage(MESSAGE_TYPES.initiateBrowserStateResponse, {
                customCommands: [...(this.#customCommands.get(route.cid) || [])]
            })
            return client.send(WDIO_EVENT_NAME, result)
        }

        if (route.kind === 'drop') {
            const type = isUnknownMessage(data) ? data.type : typeof data
            return log.error(`Dropping invalid browser channel message (type: ${String(type)})`)
        }

        /**
         * console output and the final test report do not expect a reply.
         * Tracking them would leak pending entries for every `console.log`.
         */
        if (route.kind === 'event' || route.kind === 'request') {
            const id = this.#msgId++
            if (route.kind === 'request') {
                this.#pendingMessages.set(id, { id, client })
            }
            return worker.postMessage('workerRequest', { id, message: route.message }, true)
        }

        return assertRouteHandled(route)
    }
}

function assertRouteHandled (route: never): never {
    throw new Error(`Unhandled browser channel route (${String(route)})`)
}

function isUnknownMessage (data: unknown): data is { type?: unknown } {
    return Boolean(data) && typeof data === 'object'
}
