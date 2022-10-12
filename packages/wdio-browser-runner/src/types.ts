import { Workers } from '@wdio/types'

export interface RunArgs extends Workers.WorkerRunPayload {
    command: string
    args: any
}

export interface Environment {
    args: any
}
