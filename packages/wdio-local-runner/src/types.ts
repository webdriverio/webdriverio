import type { WorkerRunPayload } from '@wdio/types'
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
