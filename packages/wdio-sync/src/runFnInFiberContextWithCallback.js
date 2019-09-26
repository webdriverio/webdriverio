import Fiber from './fibers'

/**
 * global function to wrap callbacks into Fiber context
 * @param  {Function} fn  function to wrap around
 * @return {Function}     wrapped around function
 */
/* istanbul ignore next */
export default function runFnInFiberContextWithCallback (fn, done) {
    return function (...args) {
        return Fiber(() => {
            global._HAS_FIBER_CONTEXT = true
            const result = fn.apply(this, args)
            global._HAS_FIBER_CONTEXT = false

            if (typeof done === 'function') {
                done(result)
            }
        }).run()
    }
}
