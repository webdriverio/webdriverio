import { Transform } from 'stream'

export default class RunnerTransformStream extends Transform {
    constructor (cid, emitter) {
        super()
        this.cid = cid
        this.emitter = emitter
    }

    _transform(chunk, encoding, callback) {
        const logMsg = chunk.toString()

        if (logMsg.startsWith('Debugger listening on ws')) {
            return callback()
        }

        this.push(`[${this.cid}] ${logMsg}`)
        callback()
    }
}
