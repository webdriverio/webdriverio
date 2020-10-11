import logger from '@wdio/logger'

const log = logger('@wdio/sync')

let Fiber
let Future

global._HAS_FIBER_CONTEXT = false

const origErrorFn = console.error.bind(console)
const errors = []
console.error = /* istanbul ignore next */ (...args) => errors.push(args)

/**
 * Helper method to retrieve a version of `fibers` for your Node version.
 */
try {
    /**
     * try original fibers package first
     */
    Fiber = require('fibers')
    Future = require('fibers/future')
} catch (e) {
    log.debug('Couldn\'t load fibers package for Node v10 and above')
}

console.error = origErrorFn

/**
 * throw if no fibers could be loaded
 */
if (!Fiber || !Future) {
    throw new Error(
        'No proper `fibers` package could be loaded. It might be not ' +
        'supported with your current Node version. Please ensure to use ' +
        `only WebdriverIOs recommended Node versions.\n${errors.join('\n')}`
    )
}

export default Fiber
export { Future }
