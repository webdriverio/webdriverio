import type { EventEmitter } from 'node:events'
import type {
    DesiredCapabilities,
    MultiRemoteCapabilities,
    RemoteCapability,
    W3CCapabilities,
} from './Capabilities'
import type { Testrunner as TestrunnerOptions } from './Options'

export interface Job {
    caps: DesiredCapabilities | W3CCapabilities | MultiRemoteCapabilities
    specs: string[]
    hasTests: boolean
}

export type WorkerMessageArgs = Omit<Job, 'caps' | 'specs' | 'hasTests'>

export interface WorkerRunPayload {
    cid: string
    configFile: string
    caps: RemoteCapability
    specs: string[]
    execArgv: string[]
    retries: number
}

export interface WorkerCommand extends Omit<WorkerRunPayload, 'execArgv'> {
    command: string
    args: any
}

export interface WorkerMessage {
    name: string
    content: {
        sessionId?: string
        isMultiremote?: boolean
    }
    origin: string
    params: Record<string, string>
}

export interface Worker
    extends Omit<TestrunnerOptions, 'capabilities' | 'specs' | 'rootDir'>,
        EventEmitter {
    capabilities: RemoteCapability
    caps: RemoteCapability
    cid: string
    isBusy?: boolean
    postMessage: (command: string, args: WorkerMessageArgs) => void
    specs: string[]
    sessionId?: string
}

export type WorkerPool = Record<string, Worker>
