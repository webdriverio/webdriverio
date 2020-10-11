import Fiber from './fibers'

import executeHooksWithArgs from './executeHooksWithArgs'
import runFnInFiberContext from './runFnInFiberContext'
import wrapCommand from './wrapCommand'

import { STACKTRACE_FILTER_FN } from './constants'

declare global {
  namespace NodeJS {
      interface Global {
          _HAS_FIBER_CONTEXT: boolean
          WDIO_WORKER: boolean
          browser: {
              _NOT_FIBER?: boolean
          }
      }
  }
}

export type Retries = {
    attempts: number;
    limit: number;
}

const defaultRetries: Retries = { attempts: 0, limit: 0 }

/**
 * execute test or hook synchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {Retries}   retries    { limit: number, attempts: number }
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
async function executeSync<T>(this: any, fn: Function, retries = defaultRetries, args: unknown[] = []): Promise<T> {
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
    } catch (e) {
        if (retries.limit > retries.attempts) {
            retries.attempts++
            return await executeSync.call(this, fn, retries, args) as Promise<T>
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
 * run hook or spec via executeSync
 */
function runSync(this: unknown, fn: Function, repeatTest = defaultRetries, args: unknown[] = []) {
    return (resolve: any, reject: any) =>
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
