/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventEmitter } from 'node:events'
import type { Testrunner as TestrunnerOptions } from './Options.js'
import type { AnyIPCMessage } from './ipc/messages.js'
import type { AnyWSMessage } from './ws/messages.js'

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
        id: number
        message: AnyIPCMessage | AnyWSMessage
    }
}

export interface WorkerEvent {
    name: 'workerEvent'
    origin: string
    args: AnyIPCMessage | AnyWSMessage
}

export interface WorkerMessage {
    name: string
    content: {
        sessionId?: string
        isMultiremote?: boolean
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
    postMessage: (command: string, args: WorkerMessageArgs) => void
    specs: string[]
    sessionId?: string
    logsAggregator: string[]
}

export type WorkerPool = Record<string, Worker>

