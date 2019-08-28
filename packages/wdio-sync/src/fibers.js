import logger from '@wdio/logger'

const log = logger('@wdio/sync')

let Fiber
let Future

global._HAS_FIBER_CONTEXT = false

/**
 * Helper method to retrieve a version of `fibers` for your Node version.
 */
try {
    /**
     * try original fibers package first
     */
    // eslint-disable-next-line import/no-unresolved
    Fiber = require('fibers')
    // eslint-disable-next-line import/no-unresolved
    Future = require('fibers/future')
} catch (e) {
    log.debug('Couldn\'t load fibers package for Node v10 and above')
}

if (!Fiber || !Future) {
    try {
        /**
         * fallback to fibers compiled for Node v8
         */
        // eslint-disable-next-line import/no-unresolved
        Fiber = require('fibers_node_v8')
        // eslint-disable-next-line import/no-unresolved
        Future = require('fibers_node_v8/future')
    } catch (e) {
        log.debug('Couldn\'t load fibers package for Node v8')
    }
}

/**
 * throw if no fibers could be loaded
 */
if (!Fiber || !Future) {
    throw new Error(
        'No proper `fibers` package could be loaded. It might be not ' +
        'supported with your current Node version. Please ensure to use ' +
        'only WebdriverIOs recommended Node versions.'
    )
}

export default Fiber
export { Future }
