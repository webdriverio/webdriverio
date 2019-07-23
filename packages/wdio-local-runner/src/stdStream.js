import { Transform } from 'stream'
import { removeLastListener } from './utils'

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

    _transform (chunk, encoding, callback) {
        callback(null, chunk)
    }

    _final (callback) {
        this.unpipe()
        callback()
    }
}
