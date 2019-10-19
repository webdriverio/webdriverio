import Fiber from './fibers'

/**
 * Global function to wrap callbacks into a Fiber context.
 * @param  {Function} fn - Function to wrap around
 * @return {Function}    - Wrapped function.
 */
export default function runFnInFiberContext (fn) {
    return function (...args) {
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
