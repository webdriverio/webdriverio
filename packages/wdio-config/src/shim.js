import logger from '@wdio/logger'
import { testFrameworkFnWrapper, runTestInFiberContext } from '@wdio/utils'

const log = logger('@wdio/config')

let executeHooksWithArgs = async function executeHooksWithArgsShim (hooks, args) {
    /**
     * make sure hooks are an array of functions
     */
    if (!Array.isArray(hooks)) {
        hooks = [hooks]
    }

    /**
     * make sure args is an array since we are calling apply
     */
    if (!Array.isArray(args)) {
        args = [args]
    }

    hooks = hooks.map((hook) => new Promise((resolve) => {
        let result

        try {
            result = hook.apply(null, args)
        } catch (e) {
            log.error(e.stack)
            return resolve(e)
        }

        /**
         * if a promise is returned make sure we don't have a catch handler
         * so in case of a rejection it won't cause the hook to fail
         */
        if (result && typeof result.then === 'function') {
            return result.then(resolve, (e) => {
                log.error(e.stack)
                resolve(e)
            })
        }

        resolve(result)
    }))

    return Promise.all(hooks)
}

let runFnInFiberContext = (fn) => {
    return function (...args) {
        return Promise.resolve(fn.apply(this, args))
    }
}
let wrapCommand = (_, origFn) => origFn
let hasWdioSyncSupport = false
let executeSync = (fn, _, args = []) => fn.apply(this, args)
let executeAsync = (fn, _, args = []) => fn.apply(this, args)
let runSync = null

/**
 * shim to make sure that we only wrap commands if wdio-sync is installed as dependency
 */
try {
    // eslint-disable-next-line import/no-unresolved
    const wdioSync = require('@wdio/sync')
    hasWdioSyncSupport = true
    runFnInFiberContext = wdioSync.runFnInFiberContext
    wrapCommand = wdioSync.wrapCommand
    executeHooksWithArgs = wdioSync.executeHooksWithArgs
    executeSync = wdioSync.executeSync
    executeAsync = wdioSync.executeAsync
    runSync = wdioSync.runSync
} catch {
    // do nothing
}

/**
 * wraps test framework spec/hook function with WebdriverIO before/after hooks
 *
 * @param   {string} type           Test/Step or Hook
 * @param   {object} spec           specFn and specFnArgs
 * @param   {object} before         beforeFn and beforeFnArgs
 * @param   {object} after          afterFn and afterFnArgs
 * @param   {string} cid            cid
 * @param   {number} repeatTest     number of retries if test fails
 * @return  {*}                     specFn result
 */
let testFnWrapper = function (...args) {
    return testFrameworkFnWrapper.call(this, { executeHooksWithArgs, executeAsync, runSync }, ...args)
}

export {
    executeHooksWithArgs,
    runTestInFiberContext,
    runFnInFiberContext,
    wrapCommand,
    hasWdioSyncSupport,
    executeSync,
    executeAsync,
    testFnWrapper
}
