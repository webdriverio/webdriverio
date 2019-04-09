import Fiber from 'fibers'

/**
 * global function to wrap callbacks into Fiber context
 * @param  {Function} fn  function to wrap around
 * @return {Function}     wrapped around function
 */
export default function runFnInFiberContext (fn) {
    return function (...args) {
        return new Promise((resolve, reject) => Fiber(() => {
            try {
                const result = fn.apply(this, args)
                return resolve(result)
            } catch (err) {
                return reject(err)
            }
        }).run())
    }
}
