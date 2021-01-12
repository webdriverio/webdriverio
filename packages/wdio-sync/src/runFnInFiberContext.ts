import type { Browser } from 'webdriverio'

import Fiber from './fibers'

/**
 * global function to wrap callbacks into Fiber context
 * @param  {Function} fn  function to wrap around
 * @return {Function}     wrapped around function
 */
export default function runFnInFiberContext (fn: Function) {
    return function (this: Browser, ...args: any[]) {
        delete global.browser._NOT_FIBER

        return new Promise((resolve, reject) => Fiber(() => {
            try {
                global._HAS_FIBER_CONTEXT = true
                const result = fn.apply(this, args)
                global._HAS_FIBER_CONTEXT = false
                return resolve(result)
            } catch (err) {
                return reject(err)
            }
        }).run())
    }
}
