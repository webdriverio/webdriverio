import logger from '@wdio/logger'

const log = logger('@wdio/sync')

let MaybeFiber
let MaybeFuture

global._HAS_FIBER_CONTEXT = false

const origErrorFn = console.error.bind(console)
const errors: any = []
console.error = /* istanbul ignore next */ (...args: unknown[]) => errors.push(args)

/**
 * Helper method to retrieve a version of `fibers` for your Node version.
 */
try {
    /**
     * try original fibers package first
     */
    MaybeFiber = require('fibers')
    MaybeFuture = require('fibers/future')
} catch (e) {
    log.debug('Couldn\'t load fibers package for Node v10 and above')
}

console.error = origErrorFn

/**
 * throw if no fibers could be loaded
 */
if (!MaybeFiber || !MaybeFuture) {
    throw new Error(
        'No proper `fibers` package could be loaded. It might be not ' +
        'supported with your current Node version. Please ensure to use ' +
        `only WebdriverIOs recommended Node versions.\n${errors.join('\n')}`
    )
}

const Fiber = MaybeFiber
const Future = MaybeFuture

export default Fiber
export { Future }
