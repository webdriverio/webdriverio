import logger from '@wdio/logger'

import type { FiberConstructor, FutureConstructor } from './types'

const log = logger('@wdio/sync')

let Fiber: FiberConstructor
let Future: FutureConstructor

global._HAS_FIBER_CONTEXT = false

const origErrorFn = console.error.bind(console)
const errors: Error[] = []
console.error = /* istanbul ignore next */ (...args: Error[]) => errors.push(...args)

/**
 * only load @wdio/sync with Node.js v15 and below
 */
const [major] = process.versions.node.split('.')
/* istanbul ignore if */
if (parseInt(major) >= 16) {
    throw new Error(
        '@wdio/sync is not support with NodeJS v16 and above. Please migrate your code base ' +
        'using async/await for command execution. Read more about this in our migration ' +
        'guide: https://webdriver.io/docs/async-migration.\n'
    )
}

/**
 * Helper method to retrieve a version of `fibers` for your Node version.
 */
try {
    /**
     * try original fibers package first
     */
    Fiber = require('fibers')
    Future = require('fibers/future')
} catch (err: any) {
    log.debug('Couldn\'t load fibers package for Node v12 and above')
}

console.error = origErrorFn

/**
 * throw if no fibers could be loaded
 */
// @ts-ignore
if (!Fiber || !Future) {
    throw new Error(
        'No proper `fibers` package could be loaded. It might be not ' +
        'supported with your current Node version. Please ensure to use ' +
        `only WebdriverIOs recommended Node versions.\n${errors.join('\n')}`
    )
}

export default Fiber
export { Future }
