/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventEmitter } from 'node:events'
import type { Testrunner as TestrunnerOptions } from './Options.js'
import type { AnyBrowserToRunnerMessage, WorkerProcessEvent } from './BrowserChannel.js'

export type {
    SocketMessage,
    ConsoleEvent,
    ExpectMatchersRequest,
    ExpectMatchersResponse,
    BrowserTestResults,
    BrowserTestEvent,
    CustomCommandEvent,
    BrowserStateRequest,
    BrowserState,
    HookTriggerEvent,
    HookResultEvent,
    CommandRequestEvent,
    CommandResponseEvent,
    ExpectRequestEvent,
    ExpectResponseEvent,
    ChannelError,
    CoverageMapPayload,
    AnyBrowserToRunnerMessage,
    AnyRunnerToBrowserMessage,
    AnyBrowserChannelMessage,
    SocketMessageValue,
    SocketMessagePayload,
} from './BrowserChannel.js'

export { MESSAGE_TYPES } from './BrowserChannel.js'

export interface Job {
    caps: WebdriverIO.Capabilities
    specs: string[]
    hasTests: boolean
    baseUrl?: string
    config?: TestrunnerOptions & { sessionId?: string }
    capabilities?: WebdriverIO.Capabilities
}

export type WorkerMessageArgs = Omit<Job, 'caps' | 'specs' | 'hasTests'>

export interface WorkerRunPayload {
    cid: string
    configFile: string
    caps: WebdriverIO.Capabilities
    specs: string[]
    execArgv: string[]
    retries: number
}

export interface WorkerCommand extends Omit<WorkerRunPayload, 'execArgv'> {
    command: string
    args: any
}

export interface WorkerRequest {
    command: 'workerRequest'
    args: {
        /**
         * Communicator routing id. This is not the id inside `message.value`,
         * which correlates a promise in the browser. The two stay independent
         * so a reply is routed back to the Vite client that sent the request.
         */
        id: number
        message: AnyBrowserToRunnerMessage
    }
}

export interface WorkerEvent {
    name: 'workerEvent'
    origin: string
    args: WorkerProcessEvent
}

export interface WorkerMessage {
    name: string
    specFileRetries?: number
    content: {
        sessionId?: string
        isMultiRemote?: boolean
        capabilities: WebdriverIO.Capabilities
    }
    origin: string
    params: Record<string, string>
}

export interface Worker
    extends Omit<TestrunnerOptions, 'capabilities' | 'specs' | 'rootDir'>,
    EventEmitter {
    capabilities: WebdriverIO.Capabilities
    config: TestrunnerOptions,
    caps: WebdriverIO.Capabilities
    cid: string
    isBusy?: boolean
    postMessage: (command: string, args: WorkerMessageArgs | WorkerRequest['args']) => void
    specs: string[]
    sessionId?: string
    logsAggregator: string[]
}

export type WorkerPool = Record<string, Worker>
