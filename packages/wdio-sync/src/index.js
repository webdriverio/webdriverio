import Fiber from './fibers'

import executeHooksWithArgs from './executeHooksWithArgs'
import runFnInFiberContext from './runFnInFiberContext'
import wrapCommand from './wrapCommand'

import { STACKTRACE_FILTER_FN } from './constants'

/**
 * execute test or hook synchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   repeatTest number of retries
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
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
 * execute test or hook asynchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   repeatTest number of retries
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */

const executeAsync = function (fn, repeatTest = 0, args = []) {
    let result, error

    /**
     * if a new hook gets executed we can assume that all commands should have finished
     * with exception of timeouts where `commandIsRunning` will never be reset but here
     */
    // commandIsRunning = false

    try {
        result = fn.apply(this, args)
    } catch (e) {
        error = e
    }

    /**
     * handle errors that get thrown directly and are not cause by
     * rejected promises
     */
    if (error) {
        if (repeatTest) {
            return executeAsync(fn, --repeatTest, args)
        }
        return new Promise((resolve, reject) => reject(error))
    }

    /**
     * handle promise response
     */
    if (result && typeof result.catch === 'function') {
        return result.catch((e) => {
            if (repeatTest) {
                return executeAsync(fn, --repeatTest, args)
            }

            e.stack = e.stack.split('\n').filter(STACKTRACE_FILTER_FN).join('\n')
            return Promise.reject(e)
        })
    }

    /**
     * if we don't retry just return result
     */
    return new Promise(resolve => resolve(result))
}

/**
 * run hook or spec via executeSync
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
