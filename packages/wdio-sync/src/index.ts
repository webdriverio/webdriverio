import Fiber from './fibers'
import type { Browser } from 'webdriverio'

import executeHooksWithArgs from './executeHooksWithArgs'
import runFnInFiberContext from './runFnInFiberContext'
import wrapCommand from './wrapCommand'

import { stackTraceFilter } from './utils'
const defaultRetries = { attempts: 0, limit: 0 }

declare global {
    var _HAS_FIBER_CONTEXT: boolean
    var browser: any
}

/**
 * execute test or hook synchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   retries    { limit: number, attempts: number }
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
async function executeSync (this: Browser<'async'>, fn: Function, retries = defaultRetries, args: any[] = []): Promise<any> {
    /**
     * User can also use the `@wdio/sync` package directly to run commands
     * synchronously in standalone mode. In this case we neither have
     * `global.browser` nor `this`
     */
    if (global.browser) {
        delete global.browser._NOT_FIBER
    }
    if (this) {
        this.wdioRetries = retries.attempts
    }

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
    } catch (err: any) {
        if (retries.limit > retries.attempts) {
            retries.attempts++
            return await executeSync.call(this, fn, retries, args)
        }

        /**
         * no need to modify stack if no stack available
         */
        if (!err.stack) {
            return Promise.reject(err)
        }

        err.stack = err.stack.split('\n').filter(stackTraceFilter).join('\n')
        return Promise.reject(err)
    }
}

/**
 * run hook or spec via executeSync
 */
function runSync (this: any, fn: Function, repeatTest?: typeof defaultRetries, args: any[] = []) {
    return (resolve: (value: any) => void, reject: (err: Error) => void) =>
        Fiber(() => executeSync.call(this, fn, repeatTest, args).then(resolve, reject)).run()
}

export {
    executeHooksWithArgs,
    wrapCommand,
    runFnInFiberContext,
    executeSync,
    runSync,
}

export default function sync(testFn: Function) {
    return new Promise((resolve, reject) => {
        return runSync(testFn)(resolve, reject)
    })
}
