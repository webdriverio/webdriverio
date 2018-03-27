import { Transform } from 'stream'

export default class RunnerTransformStream extends Transform {
    constructor (cid) {
        super()
        this.cid = cid
    }

    _transform(chunk, encoding, callback) {
        this.push(`[${this.cid}] ${chunk.toString()}`)
        callback()
    }
}
