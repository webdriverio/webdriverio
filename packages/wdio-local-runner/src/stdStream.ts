import { Transform, TransformCallback } from 'node:stream'
import { removeLastListener } from './utils.js'

export default class RunnerStream extends Transform {
    constructor () {
        super()

        /**
         * Remove events that are automatically created by Writable stream
         */
        this.on('pipe', () => {
            removeLastListener(this, 'close')
            removeLastListener(this, 'drain')
            removeLastListener(this, 'error')
            removeLastListener(this, 'finish')
            removeLastListener(this, 'unpipe')
        })
    }

    _transform (chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        callback(undefined, chunk)
    }

    _final (callback: (error?: Error | undefined) => void): void {
        this.unpipe()
        callback()
    }
}
