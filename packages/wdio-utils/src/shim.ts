import iterators from 'p-iteration'
import logger from '@wdio/logger'
import type { Clients } from '@wdio/types'

const log = logger('@wdio/utils:shim')

let inCommandHook = false

interface Retries {
    limit: number
    attempts: number
}

declare global {
    // eslint-disable-next-line no-var
    var expectAsync: any
}

declare global {
    namespace NodeJS {
        interface Global {
            expect: any
            expectAsync: any
        }
    }
}

const ELEMENT_QUERY_COMMANDS = [
    '$', '$$', 'custom$', 'custom$$', 'shadow$', 'shadow$$', 'react$',
    'react$$', 'nextElement', 'previousElement', 'parentElement'
]
const ELEMENT_PROPS = [
    'elementId', 'error', 'selector', 'parent', 'index', 'isReactElement',
    'length'
]
const ACTION_COMMANDS = ['action', 'actions']
const PROMISE_METHODS = ['then', 'catch', 'finally']

const executeHooksWithArgs = async function executeHooksWithArgsShim<T> (this: any, hookName: string, hooks: Function | Function[] = [], args: any[] = []): Promise<(T | Error)[]> {
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
            result = hook.apply(this, args)
        } catch (e: any) {
            log.error(e.stack)
            return resolve(e)
        }

        /**
         * if a promise is returned make sure we don't have a catch handler
         * so in case of a rejection it won't cause the hook to fail
         */
        if (result && typeof result.then === 'function') {
            return result.then(resolve, (e: Error) => {
                log.error(e.stack || e.message)
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

/**
 * wrap command to enable before and after command to be executed
 * @param commandName name of the command (e.g. getTitle)
 * @param fn          command function
 */
const wrapCommand = function wrapCommand<T>(commandName: string, fn: Function): (...args: any) => Promise<T> {
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
        } catch (err: any) {
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

    function wrapElementFn (promise: Promise<Clients.Browser>, cmd: Function, args: any[], prevInnerArgs?: { prop: string | number, args: any[] }): any {
        return new Proxy(
            Promise.resolve(promise).then((ctx: Clients.Browser) => cmd.call(ctx, ...args)),
            {
                get: (target, prop: string) => {
                    /**
                     * handle symbols, e.g. async iterators
                     */
                    if (typeof prop === 'symbol') {
                        return () => ({
                            i: 0,
                            target,
                            async next () {
                                const elems = await this.target
                                if (!Array.isArray(elems)) {
                                    throw new Error('Can not iterate over non array')
                                }

                                if (this.i < elems.length) {
                                    return { value: elems[this.i++], done: false }
                                }

                                return { done: true }
                            }
                        })
                    }

                    /**
                     * if we access an index on an element array promise, e.g.:
                     * ```js
                     * const elems = await $$('foo')[2]
                     * ```
                     */
                    const numValue = parseInt(prop, 10)
                    if (!isNaN(numValue)) {
                        return wrapElementFn(
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
                            [prop],
                            { prop, args }
                        )
                    }

                    /**
                     * if we call a query method on a resolve promise, e.g.:
                     * ```js
                     * await $('foo').$('bar')
                     * ```
                     */
                    if (ELEMENT_QUERY_COMMANDS.includes(prop) || prop.endsWith('$')) {
                        // this: WebdriverIO.Element
                        return wrapCommand(prop, function (this: any, ...args: any) {
                            return this[prop].apply(this, args)
                        })
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
                    if (PROMISE_METHODS.includes(prop)) {
                        return target[prop as 'then' | 'catch' | 'finally'].bind(target)
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
         * if the command suppose to return an element, we apply `chainElementQuery` to allow
         * chaining of these promises.
         */
        const command = ELEMENT_QUERY_COMMANDS.includes(commandName) || commandName.endsWith('$')
            ? chainElementQuery
            : ACTION_COMMANDS.includes(commandName)
                /**
                 * actions commands are a bit special as they return their own
                 * sync interface
                 */
                ? fn
                : wrapCommandFn

        return command.apply(this, args)
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
        const result = fn.apply(this, args)

        if (result && typeof result.finally === 'function') {
            result.catch((err: any) => err)
        }

        return await result
    } catch (err: any) {
        if (retries.limit > retries.attempts) {
            retries.attempts++
            return await executeAsync.call(this, fn, retries, args)
        }

        throw err
    }
}

export {
    executeHooksWithArgs,
    wrapCommand,
    executeAsync,
}
