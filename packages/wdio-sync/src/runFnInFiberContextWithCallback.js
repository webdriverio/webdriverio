import Fiber from 'fibers'

/**
 * global function to wrap callbacks into Fiber context
 * @param  {Function} fn  function to wrap around
 * @return {Function}     wrapped around function
 */

export default function runFnInFiberContextWithCallback (fn, done) {
    return function (...args) {
        return Fiber(() => {
            const result = fn.apply(this, args)

            if (typeof done === 'function') {
                done(result)
            }
        }).run()
    }
}
