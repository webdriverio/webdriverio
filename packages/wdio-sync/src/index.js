import Fiber from './fibers'

import executeHooksWithArgs from './executeHooksWithArgs'
import runFnInFiberContext from './runFnInFiberContext'
import wrapCommand from './wrapCommand'

import { STACKTRACE_FILTER_FN } from './constants'

/**
 * Execute test or hook synchronously.
 *
 * @param  {Function} fn         - Spec or hook method
 * @param  {Number}   repeatTest - Number of retries
 * @param  {Array}    args       - Number of retries
 * @return {Promise} - Resolved once test/hook is done or retries are exhausted
 */
const executeSync = async function (fn, repeatTest = 0, args = []) {
    delete global.browser._NOT_FIBER

    try {
        global._HAS_FIBER_CONTEXT = true
        let res = fn.apply(this, args)
        global._HAS_FIBER_CONTEXT = false

        /**
         * sometimes function result is Promise,
         * we need to await result before proceeding
         */
        if (res instanceof Promise) {
            return await res
        }

        return res
    } catch (e) {
        if (repeatTest) {
            return await executeSync(fn, --repeatTest, args)
        }

        /**
         * no need to modify stack if no stack available
         */
        if (!e.stack) {
            return Promise.reject(e)
        }

        e.stack = e.stack.split('\n').filter(STACKTRACE_FILTER_FN).join('\n')
        return Promise.reject(e)
    }
}

/**
 * Execute test or hook asynchronously.
 *
 * @param  {Function} fn         - Spec or hook method
 * @param  {Number}   repeatTest - Number of retries
 * @return {Promise} - Resolved once test/hook is done or retries are exhausted
 */

const executeAsync = async function (fn, repeatTest = 0, args = []) {
    /**
     * If a new hook gets executed, we can assume that all commands should have finised
     * with exception of timeouts, where `commandIsRunning` will never be reset but here.
     */
    // commandIsRunning = false

    try {
        return await fn.apply(this, args)
    } catch (e) {
        if(repeatTest > 0) {
            return await executeAsync(fn, --repeatTest, args)
        }

        e.stack = e.stack.split('\n').filter(STACKTRACE_FILTER_FN).join('\n')
        throw e
    }
}

/**
 * Run hook / spec via `executeSync`.
 */
function runSync (fn, repeatTest = 0, args = []) {
    return (resolve, reject) =>
        Fiber(() => executeSync.call(this, fn, repeatTest, args).then(resolve, reject)).run()
}

export {
    executeHooksWithArgs,
    wrapCommand,
    runFnInFiberContext,
    executeSync,
    executeAsync,
    runSync,
}
