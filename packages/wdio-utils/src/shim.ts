import iterators from 'p-iteration'
import logger from '@wdio/logger'
import { Clients } from '@wdio/types'

const log = logger('@wdio/utils:shim')

let inCommandHook = false
let hasWdioSyncSupport = false
let runSync: (this: unknown, fn: Function, repeatTest: any, args: unknown[]) => (resolve: Function, reject: Function) => unknown

interface Retries {
    limit: number
    attempts: number
}

interface WDIOSync {
    runFnInFiberContext: any
    wrapCommand: any
    executeHooksWithArgs: any
    executeSync: any
    runSync: any
}

interface PropertiesObject {
    [key: string]: PropertyDescriptor
}

declare global {
    var _HAS_FIBER_CONTEXT: boolean
}

const ELEMENT_QUERY_COMMANDS = ['$', '$$', 'custom$', 'custom$$', 'shadow$', 'shadow$$', 'react$', 'react$$']
const ELEMENT_PROPS = ['elementId', 'error', 'selector', 'parent', 'index', 'isReactElement', 'length']

/**
 * shim to make sure that we only wrap commands if wdio-sync is installed as dependency
 */
let wdioSync: WDIOSync | undefined
export let runAsync = false
try {
    const packageName = '@wdio/sync'
    wdioSync = require(packageName)
    hasWdioSyncSupport = true

    /**
     * only print within worker process
     */
    if (process.send) {
        log.warn(
            'You are running tests with @wdio/sync which will be discontinued starting Node.js v16.' +
            'Read more on https://github.com/webdriverio/webdriverio/discussions/6702'
        )
    }
} catch (err) {
    runAsync = true
}

let executeHooksWithArgs = async function executeHooksWithArgsShim<T> (hookName: string, hooks: Function | Function[] = [], args: any[] = []): Promise<(T | Error)[]> {
    runAsync = true

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

    const hooksPromises = hooks.map((hook) => new Promise<T | Error>((resolve) => {
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
            return result.then(resolve, (e: Error) => {
                log.error(e.stack)
                resolve(e)
            })
        }

        resolve(result)
    }))

    const start = Date.now()
    const result = await Promise.all(hooksPromises)
    if (hooksPromises.length) {
        log.debug(`Finished to run "${hookName}" hook in ${Date.now() - start}ms`)
    }
    return result
}

let runFnInFiberContext = function (fn: Function) {
    return function (this: any, ...args: any[]) {
        runAsync = true
        return Promise.resolve(fn.apply(this, args))
    }
}

/**
 * wrap command to enable before and after command to be executed
 * @param commandName name of the command (e.g. getTitle)
 * @param fn          command function
 */
let wrapCommand = function wrapCommand<T>(commandName: string, fn: Function, propertiesObject: PropertiesObject): (...args: any) => Promise<T> {
    async function wrapCommandFn(this: any, ...args: any[]) {
        const beforeHookArgs = [commandName, args]
        if (!inCommandHook && this.options.beforeCommand) {
            inCommandHook = true
            await executeHooksWithArgs.call(this, 'beforeCommand', this.options.beforeCommand, beforeHookArgs)
            inCommandHook = false
        }

        let commandResult
        let commandError
        try {
            commandResult = await fn.apply(this, args)
        } catch (err) {
            commandError = err
        }

        if (!inCommandHook && this.options.afterCommand) {
            inCommandHook = true
            const afterHookArgs = [...beforeHookArgs, commandResult, commandError]
            await executeHooksWithArgs.call(this, 'afterCommand', this.options.afterCommand, afterHookArgs)
            inCommandHook = false
        }

        if (commandError) {
            throw commandError
        }

        return commandResult
    }

    function wrapElementFn (promise: Promise<Clients.Browser>, cmd: Function, args: any[], prevInnerArgs?: { prop: string, args: any[] }): any {
        return new Proxy(
            Promise.resolve(promise).then((ctx: Clients.Browser) => cmd.call(ctx, ...args)),
            {
                get: (target, prop: string) => {
                    /**
                     * if we call a query method on a resolve promise, e.g.:
                     * ```js
                     * await $('foo').$('bar')
                     * ```
                     */
                    if (ELEMENT_QUERY_COMMANDS.includes(prop)) {
                        return wrapCommand(prop, propertiesObject[prop].value, propertiesObject)
                    }

                    /**
                     * if we call "get" on an element array promise, e.g.:
                     * ```js
                     * const elems = await $$('foo').get(2)
                     * ```
                     */
                    if (commandName.endsWith('$$') && prop === 'get') {
                        return (index: number) => wrapElementFn(
                            target,
                            /**
                             * `this` is an array of WebdriverIO elements
                             *
                             * Note(Christian): types for elements are defined in the
                             * webdriverio package and not accessible here
                             */
                            function (this: object[], index: number) {
                                return this[index]
                            },
                            [index],
                            { prop, args }
                        )
                    }

                    /**
                     * if we call an array iterator function like map or forEach on an
                     * set of elements, e.g.:
                     * ```js
                     * await $('body').$('header').$$('div').map((elem) => elem.getLocation())
                     * ```
                     */
                    if (commandName.endsWith('$$') && typeof iterators[prop as keyof typeof iterators] === 'function') {
                        return (mapIterator: Function) => wrapElementFn(
                            target,
                            function (this: never, mapIterator: Function): any {
                                // @ts-ignore
                                return iterators[prop](this, mapIterator)
                            },
                            [mapIterator]
                        )
                    }

                    /**
                     * allow to grab the length or other properties of fetched element set, e.g.:
                     * ```js
                     * const elemAmount = await $$('foo').length
                     * ```
                     */
                    if (ELEMENT_PROPS.includes(prop)) {
                        return target.then((res) => res[prop])
                    }

                    /**
                     * allow to resolve an chained element query, e.g.:
                     * ```js
                     * const elem = await $('foo').$('bar')
                     * console.log(elem.selector) // "bar"
                     * ```
                     */
                    if (prop === 'then') {
                        return target[prop].bind(target)
                    }

                    /**
                     * call a command on an element query, e.g.:
                     * ```js
                     * const tagName = await $('foo').$('bar').getTagName()
                     * ```
                     */
                    return (...args: any[]) => target.then(async (elem) => {
                        if (!elem) {
                            let errMsg = 'Element could not be found'
                            const prevElem = await promise
                            if (Array.isArray(prevElem) && prevInnerArgs && prevInnerArgs.prop === 'get') {
                                errMsg = `Index out of bounds! $$(${prevInnerArgs.args[0]}) returned only ${prevElem.length} elements.`
                            }

                            throw new Error(errMsg)
                        }
                        return elem[prop](...args)
                    })
                }
            }
        )
    }

    function chainElementQuery(this: Promise<Clients.Browser>, ...args: any[]): any {
        return wrapElementFn(this, wrapCommandFn, args)
    }

    return function (this: Clients.Browser, ...args: any[]) {
        /**
         * use sync mode if:
         * - @wdio/sync package is installed and can be resolved
         * - we are in a fiber context (flag is set when outer function is wrapped into fibers context)
         *
         * also if we run command asynchronous and the command suppose to return an element, we
         * apply `chainElementQuery` to allow chaining of these promises.
         */
        const command = hasWdioSyncSupport && wdioSync && !runAsync
            ? wdioSync!.wrapCommand(commandName, fn)
            : ELEMENT_QUERY_COMMANDS.includes(commandName)
                ? chainElementQuery
                : wrapCommandFn

        return command.apply(this, args)
    }
}

/**
 * execute test or hook synchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   retries    { limit: number, attempts: number }
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
async function executeSyncFn (this: any, fn: Function, retries: Retries, args: any[] = []): Promise<unknown> {
    this.wdioRetries = retries.attempts

    try {
        runAsync = true
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
            return await executeSyncFn.call(this, fn, retries, args)
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
async function executeAsync(this: any, fn: Function, retries: Retries, args: any[] = []): Promise<unknown> {
    this.wdioRetries = retries.attempts

    try {
        runAsync = true
        return await fn.apply(this, args)
    } catch (e) {
        if (retries.limit > retries.attempts) {
            retries.attempts++
            return await executeAsync.call(this, fn, retries, args)
        }

        throw e
    }
}

let executeSync = executeSyncFn

/**
 * Method to switch between sync and async execution. It allows to have async
 * tests in between synchronous tests. `fn` can either return a promise (e.g. for `executeSync`)
 * or a function (e.g. for `runSync`). In both cases we need to make sure that
 * we flip `runAsync` flag to true to that commands are wrapped with the @wdio/sync
 * wrapper.
 */
export function switchSyncFlag (fn: Function) {
    return function (this: unknown, ...args: any[]) {
        const switchFlag = runAsync
        runAsync = false
        const result = fn.apply(this, args)

        if (typeof result.finally === 'function') {
            return result.finally(() => (runAsync = switchFlag))
        }

        if (typeof result === 'function') {
            return function (this: any, ...args: any[]) {
                const switchFlagWithinFn = runAsync
                const res = result.apply(this, args)
                if (typeof result.finally === 'function') {
                    return result.finally(() => (runAsync = switchFlagWithinFn))
                }

                runAsync = switchFlagWithinFn
                return res
            }
        }

        runAsync = switchFlag
        return result
    }
}

/**
 * only require `@wdio/sync` if `WDIO_NO_SYNC_SUPPORT` which allows us to
 * create a smoke test scenario to test actual absence of the package
 * (internal use only)
 */
/* istanbul ignore if */
if (!process.env.WDIO_NO_SYNC_SUPPORT && hasWdioSyncSupport && wdioSync) {
    runFnInFiberContext = switchSyncFlag(wdioSync.runFnInFiberContext)
    executeHooksWithArgs = switchSyncFlag(wdioSync.executeHooksWithArgs)
    executeSync = switchSyncFlag(wdioSync.executeSync)
    runSync = switchSyncFlag(wdioSync.runSync)
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
