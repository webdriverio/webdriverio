import _Fiber from 'fibers'
import _Future from 'fibers/future'

let Fiber
let Future

/**
 * Helper method to retrieve a version of `fibers` for your Node version.
 */
if (Number(process.version.split('.')[0].match(/^v(\d+)/)[1]) < 10) {
    try {
        Fiber = require('fibersv4')
        Future = require('fibersv4/future')
    } catch (err) {
        /**
         * This handles folks that installed with `--no-optional`.
         */
        Fiber = _Fiber
        Future = _Future
    }
} else {
    /**
     * Even though `fibersv4` may be present for Node 8 users,
     * it is not likely to work, so don't attempt to use it.
     */
    Fiber = _Fiber
    Future = _Future
}

export default Fiber
export { Future }
