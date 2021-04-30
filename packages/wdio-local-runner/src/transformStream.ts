import { Transform, TransformCallback } from 'stream'
import { DEBUGGER_MESSAGES } from './constants'

export default class RunnerTransformStream extends Transform {
    cid: string

    constructor (cid: string) {
        super()
        this.cid = cid
    }

    _transform (chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        const logMsg = chunk.toString()

        if (DEBUGGER_MESSAGES.some(m => logMsg.startsWith(m))) {
            return callback()
        }

        this.push(`[${this.cid}] ${logMsg}`)
        callback()
    }

    _final (callback: (error?: Error | null) => void): void {
        this.unpipe()
        callback()
    }
}
