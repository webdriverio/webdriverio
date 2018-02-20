import logger from 'wdio-logger'

const log = logger('wdio-config')
const NOOP = () => {}

export let executeHooksWithArgs = async function executeHooksWithArgsShim (hooks, args) {
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
            return resolve()
        }

        /**
         * if a promise is returned make sure we don't have a catch handler
         * so in case of a rejection it won't cause the hook to fail
         */
        if (result && typeof result.then === 'function') {
            return result.then(resolve, (e) => {
                log.error(e.stack)
                resolve()
            })
        }

        resolve(result)
    }))

    return Promise.all(hooks)
}

export let runTestInFiberContext = NOOP
export let runFnInFiberContext = (fn, done) => {
    return function (...args) {
        const result = fn.apply(this, args)

        if (typeof done === 'function') {
            return done(result)
        }

        return result
    }
}
export let wrapCommand = (_, origFn) => origFn
export let hasWdioSyncSupport = false

/**
 * shim to make sure that we only wrap commands if wdio-sync is installed as dependency
 */
try {
    // eslint-disable-next-line import/no-unresolved
    const wdioSync = require('wdio-sync')
    log.debug('wdio-sync found, running tests synchronous')

    hasWdioSyncSupport = true
    runFnInFiberContext = wdioSync.runFnInFiberContext
    runTestInFiberContext = wdioSync.runTestInFiberContext
    wrapCommand = wdioSync.wrapCommand
    executeHooksWithArgs = wdioSync.executeHooksWithArgs
} catch (e) {
    log.debug('wdio-sync not found, running tests asynchronous')
}
