import { Transform } from 'stream'
import { DEBUGGER_MESSAGES } from './constants'

export default class RunnerTransformStream extends Transform {
    constructor (cid, emitter) {
        super()
        this.cid = cid
        this.emitter = emitter
    }

    _transform(chunk, encoding, callback) {
        const logMsg = chunk.toString()

        if (DEBUGGER_MESSAGES.some(m => logMsg.startsWith(m))) {
            return callback()
        }

        this.push(`[${this.cid}] ${logMsg}`)
        callback()
    }

    _final () {
        /**
         * we don't want to do anything here otherwise we would end the
         * stream of the local runner that captures stdout/stderr or all
         * runners and therefor would loose all incoming messages after
         * the first runner finishes.
         */
    }
}
