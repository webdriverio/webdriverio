import logger from '@wdio/logger'

const log = logger('@wdio/utils:shim')

let hasWdioSyncSupport = false
let runSync = null

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

let runFnInFiberContext = function (fn) {
    return function (...args) {
        return Promise.resolve(fn.apply(this, args))
    }
}

let wrapCommand = async function (commandName, fn, ...args) {
    await executeHooksWithArgs.call(this, this.options.beforeCommand, [commandName, args])

    let commandResult
    let commandError
    try {
        commandResult = await fn.apply(this, args)
    } catch (err) {
        commandError = err
    }

    await executeHooksWithArgs.call(this, this.options.afterCommand, [commandName, args, commandResult, commandError])

    if (commandError) {
        throw commandError
    }

    return commandResult
}

/**
 * execute test or hook synchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   retries    { limit: number, attempts: number }
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
let executeSync = async function (fn, retries, args = []) {
    this.retries = retries.attempts

    try {
        let res = fn.apply(this, args)

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
            return await executeSync.call(this, fn, retries, args)
        }

        return Promise.reject(e)
    }
}

/**
 * execute test or hook asynchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {object}   retries    { limit: number, attempts: number }
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
const executeAsync = async function (fn, retries, args = []) {
    this.retries = retries.attempts

    try {
        return await fn.apply(this, args)
    } catch (e) {
        if (retries.limit > retries.attempts) {
            retries.attempts++
            return await executeAsync.call(this, fn, retries, args)
        }

        throw e
    }
}

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
    runSync = wdioSync.runSync
} catch {
    // do nothing
}

export {
    executeHooksWithArgs,
    runFnInFiberContext,
    wrapCommand,
    hasWdioSyncSupport,
    executeSync,
    executeAsync,
    runSync
}
