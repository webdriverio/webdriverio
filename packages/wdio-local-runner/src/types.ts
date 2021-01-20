import type { Capabilities } from '@wdio/types'

export interface WorkerRunPayload {
    cid: string,
    configFile: string,
    caps: Capabilities.RemoteCapability,
    specs: string[],
    execArgv: string[],
    retries: number
}

export interface WorkerCommand extends Omit<WorkerRunPayload, 'execArgv'> {
    command: string,
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
