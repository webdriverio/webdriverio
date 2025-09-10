import logger from '@wdio/logger'
import type { Frameworks, Services, Options } from '@wdio/types'

import * as iterators from './pIteration.js'
import { getBrowserObject } from './utils.js'

const log = logger('@wdio/utils:shim')

let inCommandHook = false

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
const ELEMENT_RETURN_COMMANDS = ['getElement', 'getElements']

const TIME_BUFFER = 3

/**
 * we have to mock the WebdriverIO.Browser and WebdriverIO.MultiRemoteBrowser type
 * here as this package can't access it given it is a dependency of webdriverio
 */
interface WebdriverIOInstance extends Services.Hooks {
    selector: string
    parent: WebdriverIOInstance
    length: number
    options: Options.Testrunner
    waitUntil: Function
    $$: Function
    foundWith: string
    wdioRetries: number
    [i: number]: WebdriverIOInstance
}

export async function executeHooksWithArgs<T> (this: unknown, hookName: string, hooks: Function | Function[] = [], args: unknown[] = []): Promise<(T | Error)[]> {
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

    const rejectIfSkipped = function (e: unknown, rejectionFunc: (e?: Error) => void) {
        /**
         * When we use `this.skip()` inside a test or a hook, it's a signal that we want to stop that particular test.
         * Mocha, the testing framework, knows how to handle this for its own built-in hooks and test steps.
         * However, for our custom hooks, we need to reject the promise, which effectively skips the test case.
         * For more details, refer to: https://github.com/mochajs/mocha/pull/3859#issuecomment-534116333
         */
        if (/^(sync|async) skip; aborting execution$/.test((e as Error).message)) {
            rejectionFunc()
            return true
        }
        /**
         * in case of jasmine, when rejecting, we need to pass the message of rejection as well
         */
        if (/^=> marked Pending/.test(e as string)) {
            rejectionFunc(e as Error)
            return true
        }
    }

    const hooksPromises = hooks.map((hook) => new Promise<T | Error>((resolve, reject) => {
        let result

        try {
            result = hook.apply(this, args)
        } catch (e) {
            if (rejectIfSkipped(e, reject)) {
                return
            }
            log.error((e as Error).stack)
            return resolve(e as Error)
        }

        /**
         * if a promise is returned make sure we don't have a catch handler
         * so in case of a rejection it won't cause the hook to fail
         */
        if (result && typeof result.then === 'function') {
            return result.then(resolve, (e: Error) => {
                if (rejectIfSkipped(e, reject)) {
                    return
                }
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
export function wrapCommand<T>(commandName: string, fn: Function): (...args: unknown[]) => Promise<T> {
    async function wrapCommandFn(this: { options: Services.Hooks }, ...args: unknown[]) {
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

    function wrapElementFn (promise: Promise<WebdriverIO.Browser>, cmd: Function, args: unknown[], prevInnerArgs?: { prop: string | number, args: unknown[] }): unknown {
        return new Proxy(
            Promise.resolve(promise).then((ctx: WebdriverIO.Browser) => cmd.call(ctx, ...args)),
            {
                get: (target, prop: string) => {
                    /**
                     * handle symbols, e.g. async iterators
                     */
                    if (typeof prop === 'symbol'|| prop === 'entries') {
                        return () => ({
                            i: 0,
                            target,
                            async next () {
                                const elems = await this.target
                                if (!Array.isArray(elems)) {
                                    throw new Error('Can not iterate over non array')
                                }

                                if (this.i < elems.length) {
                                    // For entries(), return [index, element] pair
                                    if (prop === 'entries') {
                                        return { value: [this.i, elems[this.i++]], done: false }
                                    }
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
                             */
                            function (this: WebdriverIOInstance, index: number) {
                                /**
                                 * if we access an index that is out of bounds we wait for the
                                 * array to get that long, and timeout eventually if it doesn't
                                 */
                                if (index >= this.length) {
                                    const browser = getBrowserObject(this) as WebdriverIOInstance
                                    return browser.waitUntil(async () => {
                                        const elems = await this.parent[this.foundWith as unknown as '$$'](this.selector)
                                        if (elems.length > index) {
                                            return elems[index]
                                        }
                                        return false
                                    }, {
                                        timeout: browser.options.waitforTimeout,
                                        timeoutMsg: `Index out of bounds! $$(${this.selector}) returned only ${this.length} elements.`
                                    })
                                }

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
                        return wrapCommand(prop, function (this: Record<string, Function>, ...args: unknown[]) {
                            // eslint-disable-next-line prefer-spread
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
                        return (...iteratorArgs: [Function, ...unknown[]]) => wrapElementFn(
                            target,
                            function (this: never, ...iteratorArgs: [Function, ...unknown[]]) {
                                // @ts-ignore
                                return iterators[prop](this, ...iteratorArgs)
                            },
                            iteratorArgs
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
                     * Convenience methods to get the element promise. Technically we could just
                     * await an `ChainablePromiseElement` directly but this causes bad DX when
                     * chaining commands and e.g. VS Code tries to wrap promises around thenable
                     * objects.
                     */
                    if (ELEMENT_RETURN_COMMANDS.includes(prop)) {
                        return () => target
                    }

                    /**
                     * call a command on an element query, e.g.:
                     * ```js
                     * const tagName = await $('foo').$('bar').getTagName()
                     * ```
                     */
                    return (...args: unknown[]) => target.then(async (elem) => {
                        if (!elem) {
                            let errMsg = 'Element could not be found'
                            const prevElem = await promise
                            if (Array.isArray(prevElem) && prevInnerArgs && prevInnerArgs.prop === 'get') {
                                errMsg = `Index out of bounds! $$(${prevInnerArgs.args[0]}) returned only ${prevElem.length} elements.`
                            }

                            throw new Error(errMsg)
                        }

                        /**
                         * Jasmine uses `toJSON` to parse the target object for information.
                         * Since WebdriverIo doesn't have this method on the Element object
                         * we need to mimic it here
                         */
                        if (prop === 'toJSON') {
                            return { ELEMENT: elem.elementId }
                        }

                        /**
                         * provide a better error message than "TypeError: elem[prop] is not a function"
                         */
                        if (typeof elem[prop] !== 'function') {
                            throw new Error(`Can't call "${prop}" on element with selector "${elem.selector}", it is not a function`)
                        }

                        return elem[prop](...args)
                    })
                }
            }
        )
    }

    function chainElementQuery(this: Promise<WebdriverIO.Browser>, ...args: unknown[]): unknown {
        return wrapElementFn(this, wrapCommandFn, args)
    }

    return function (this: WebdriverIO.Browser, ...args: unknown[]) {
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
 * @param  {number}   timeout    The maximum time (in milliseconds) to wait for the function to complete
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
export async function executeAsync(this: WebdriverIOInstance, fn: Function, retries: Frameworks.TestRetries, args: unknown[] = [], timeout: number = 20000): Promise<unknown> {
    this.wdioRetries = retries.attempts

    try {
        /**
         * To prevent test failures due to timeout exceptions in Jasmine from overwriting test objects with subsequent values,
         * we reduce the overall timeout by a constant known as TIME_BUFFER. TIME_BUFFER acts as a safety margin, allowing a small
         * window of time for an operation to complete before triggering a timeout. This approach ensures that test results are handled
         * properly without affecting the overall test execution timing.
         */
        // @ts-expect-error
        const _timeout = (this?._runnable?._timeout || globalThis.jasmine?.DEFAULT_TIMEOUT_INTERVAL || timeout) - TIME_BUFFER
        /**
         * Executes the function with specified timeout and returns the result, or throws an error if the timeout is exceeded.
         */
        let done = false
        const result = await Promise.race([
            fn.apply(this, args),
            new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    if (done) {
                        resolve()
                    } else {
                        reject(new Error('Timeout'))
                    }
                }, _timeout)
            })
        ])
        done = true

        if (result !== null && typeof result === 'object' && 'finally' in result && typeof result.finally === 'function') {
            result.catch((err: unknown) => err)
        }

        return await result
    } catch (err) {
        if (retries.limit > retries.attempts) {
            retries.attempts++
            return await executeAsync.call(this, fn, retries, args)
        }

        throw err
    }
}
