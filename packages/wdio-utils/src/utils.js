/**
 * is function async
 * @param {Function} fn
 */
export function isFunctionAsync (fn) {
    return (fn.constructor && fn.constructor.name === 'AsyncFunction') || fn.name === 'async'
}
