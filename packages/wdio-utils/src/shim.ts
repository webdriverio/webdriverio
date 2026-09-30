import logger from '@wdio/logger'
import type { Frameworks, Services, Options } from '@wdio/types'

import * as iterators from './pIteration.js'
import { getBrowserObject } from './utils.js'
import { WDIO_KIND, WDIO_CHAINABLE, type WdioKind } from './kind.js'

const log = logger('@wdio/utils:shim')

let inCommandHook = false

const ELEMENT_QUERY_COMMANDS = [
    '$', '$$', 'custom$', 'custom$$', 'shadow$', 'shadow$$', 'react$',
    'react$$', 'nextElement', 'previousElement', 'parentElement', 'select'
]
const ELEMENT_PROPS = [
    'elementId', 'error', 'selector', 'parent', 'index', 'isReactElement',
    'length', 'instances'
]
const ACTION_COMMANDS = ['action', 'actions']
const PROMISE_METHODS = ['then', 'catch', 'finally']
const ELEMENT_RETURN_COMMANDS = ['getElement', 'getElements']
/**
 * Multi-element queries return an `ElementArray` directly. The symbol is
 * shared with `webdriverio` via `Symbol.for` so this package does not depend
 * on it.
 */
export const ELEMENT_ARRAY_WRAP = Symbol.for('webdriverio.elementArray.wrap')
export const ELEMENT_ARRAY_COMMANDS = ['$$', 'custom$$', 'react$$', 'shadow$$']

/**
 * `webdriverio` registers this so a chained call such as `$('parent').$$('child')`
 * can return an element list immediately. The shim itself does not depend on that
 * package. Without a factory, those calls keep the element-promise proxy.
 */
type ElementArrayMetadata = {
    selector?: unknown
    foundWith: string
    parent?: unknown
    props: unknown[]
    isMultiRemote?: boolean
}

type ElementArrayFactory = (
    loader: () => Promise<unknown[]>,
    metadata: ElementArrayMetadata
) => unknown
let elementArrayFactory: ElementArrayFactory | undefined

export function registerElementArrayFactory (factory: ElementArrayFactory) {
    elementArrayFactory = factory
}

const TIME_BUFFER = 3

/**
 * Kind of the result of an element query command, see `kind.ts`. The proxy of the
 * chain also gets the `WDIO_CHAINABLE` brand. `select` returns a multiremote
 * browser, not an element, so it gets no brand.
 */
function chainKind (commandName: string): WdioKind | undefined {
    if (commandName.endsWith('$$')) {
        return 'element-array'
    }
    if (commandName.endsWith('$') || ['nextElement', 'previousElement', 'parentElement'].includes(commandName)) {
        return 'element'
    }
    return undefined
}

/**
 * Private flag of a chainable proxy: `true` when the chain started on a
 * multi-remote browser, element or element list. A chained `$$` reads it, so
 * its list knows `isMultiRemote` before it loads, like a direct `$$` does.
 */
const MULTI_REMOTE_ORIGIN = Symbol('wdio.multiRemoteOrigin')

function isMultiRemoteOrigin (value: unknown): boolean {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
        return false
    }
    const source = value as { isMultiRemote?: unknown, [MULTI_REMOTE_ORIGIN]?: unknown }
    /**
     * read the flag first: on a chainable proxy, any other property is a command
     */
    return source[MULTI_REMOTE_ORIGIN] === true || source.isMultiRemote === true
}

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

export async function executeHooksWithArgs<T>(this: unknown, hookName: string, hooks: Function | Function[] = [], args: unknown[] = []): Promise<(T | Error)[]> {
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
 * Proxy around a promise of an element (or element list) so commands and
 * properties can be chained before the promise resolves.
 */
export function chainElementPromise<T> (promise: Promise<T | undefined>, multiRemote = false): T {
    return createElementPromiseProxy(
        promise,
        function (this: T) {
            return this
        },
        [],
        '$',
        undefined,
        'element',
        multiRemote
    ) as T
}

function createElementPromiseProxy (
    promise: Promise<unknown>,
    cmd: Function,
    args: unknown[],
    commandName: string,
    prevInnerArgs?: { prop: string | number, args: unknown[] },
    kind?: WdioKind,
    multiRemote = false
): unknown {
    /**
     * only an unresolved element is chainable: a pending element list (for example
     * a custom `$$` command) has the kind `'element-array'` and no chainable brand
     */
    const chainable = kind === 'element'
    return new Proxy(
        Promise.resolve(promise).then((ctx) => cmd.call(ctx, ...args)),
        {
            /**
             * the brands of the chain (see `kind.ts`), so `WDIO_KIND in $('foo')` is true
             */
            has: (target, prop) => (
                (prop === WDIO_KIND && kind !== undefined) ||
                (prop === WDIO_CHAINABLE && chainable)
            ) || Reflect.has(target, prop),
            get: (target, prop: string) => {
                /**
                 * return the brand before the symbol handling below, which
                 * treats every other symbol as an async iterator
                 */
                if ((prop as string | symbol) === WDIO_KIND) {
                    return kind
                }
                if ((prop as string | symbol) === WDIO_CHAINABLE) {
                    return chainable || undefined
                }
                if ((prop as string | symbol) === MULTI_REMOTE_ORIGIN) {
                    return multiRemote
                }

                /**
                 * handle symbols, e.g. async iterators
                 */
                if (typeof prop === 'symbol' || prop === 'entries') {
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
                    return createElementPromiseProxy(
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
                        commandName,
                        { prop, args },
                        /**
                         * an item of a pending element list (a custom `$$` command) is an
                         * element. Other values get no `wdio.kind` brand: an ElementArray
                         * brands its own index (`chainElementPromise`), so this proxy
                         * only wraps a value that is not an ElementArray, and its item is unknown
                         */
                        kind === 'element-array' ? 'element' : undefined,
                        multiRemote
                    )
                }

                /**
                 * `at()` of a pending element list is a chainable element, like an index
                 * and like `at()` of an ElementArray, see `kind.ts`
                 */
                if (prop === 'at' && kind === 'element-array') {
                    return (index: number) => createElementPromiseProxy(
                        target,
                        function (this: { at: (index: number) => unknown }, index: number) {
                            return this.at(index)
                        },
                        [index],
                        commandName,
                        { prop, args: [index] },
                        'element',
                        multiRemote
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
                    return (...iteratorArgs: [Function, ...unknown[]]) => createElementPromiseProxy(
                        target,
                        function (this: never, ...iteratorArgs: [Function, ...unknown[]]) {
                            // @ts-ignore
                            return iterators[prop](this, ...iteratorArgs)
                        },
                        iteratorArgs,
                        commandName
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
                     * Jasmine calls `toJSON` when it prints or diffs the target.
                     * WebdriverIO elements do not define it, so return the W3C
                     * element reference (`element-6066-11e4-a52e-4f735466cecf`).
                     */
                    if (prop === 'toJSON') {
                        return { 'element-6066-11e4-a52e-4f735466cecf': elem.elementId }
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

function attachElementArrayHooks (
    this: { options?: Services.Hooks },
    elementArray: { [ELEMENT_ARRAY_WRAP]?: (wrapper: (load: () => Promise<unknown>) => Promise<unknown>) => void },
    commandName: string,
    args: unknown[]
) {
    const wrap = elementArray[ELEMENT_ARRAY_WRAP]
    if (typeof wrap !== 'function') {
        return
    }

    const self = this
    wrap(async (load) => {
        const beforeHookArgs = [commandName, args]
        if (!inCommandHook && self.options?.beforeCommand) {
            inCommandHook = true
            await executeHooksWithArgs.call(self, 'beforeCommand', self.options.beforeCommand, beforeHookArgs)
            inCommandHook = false
        }

        let commandError: unknown
        try {
            await load()
        } catch (err) {
            commandError = err
        }

        if (!inCommandHook && self.options?.afterCommand) {
            inCommandHook = true
            const afterHookArgs = [...beforeHookArgs, elementArray, commandError]
            await executeHooksWithArgs.call(self, 'afterCommand', self.options.afterCommand, afterHookArgs)
            inCommandHook = false
        }

        if (commandError) {
            throw commandError
        }
    })
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

    function wrapElementFn(promise: Promise<unknown>, cmd: Function, args: unknown[], prevInnerArgs?: { prop: string | number, args: unknown[] }): unknown {
        /**
         * `promise` is the caller: a browser, an element, or the proxy of the
         * previous link of the chain, so the multi-remote origin passes along
         */
        return createElementPromiseProxy(
            promise, cmd, args, commandName, prevInnerArgs, chainKind(commandName), isMultiRemoteOrigin(promise)
        )
    }

    function chainElementQuery(this: Promise<WebdriverIO.Browser>, ...args: unknown[]): unknown {
        return wrapElementFn(this, wrapCommandFn, args)
    }

    return function (this: { options?: Services.Hooks, then?: unknown }, ...args: unknown[]) {
        /**
         * `$$` and the other multi-element queries return an ElementArray, which
         * is itself thenable and async-iterable. Don't wrap that result in
         * another promise or `for await` and `$$().map()` stop seeing the list.
         * Hooks still run, around the fetch the list performs on first use.
         *
         * A chained call (`$('foo').$$('bar')`) is invoked with the unresolved
         * element promise as `this`. That promise has to resolve before the
         * query runs, so it keeps the element-promise proxy instead of calling
         * the command on the proxy itself.
         */
        const isChainedPromise = typeof this?.then === 'function'
        if (ELEMENT_ARRAY_COMMANDS.includes(commandName)) {
            /**
             * `$('parent').$$('child')` is called with the unresolved element as
             * `this`. Build the list now and resolve the parent inside its loader,
             * so the caller still receives an array rather than a promise proxy.
             */
            if (isChainedPromise && elementArrayFactory) {
                const parent = this
                const metadata: ElementArrayMetadata = {
                    selector: args[0],
                    foundWith: commandName,
                    parent,
                    props: args.slice(1),
                    /**
                     * known before the parent resolves when the chain started on a
                     * multi-remote browser, see `MULTI_REMOTE_ORIGIN`
                     */
                    ...(isMultiRemoteOrigin(parent) ? { isMultiRemote: true } : {})
                }
                return elementArrayFactory(async () => {
                    const element = await parent as {
                        isMultiRemote?: boolean
                        [key: string]: unknown
                    }
                    metadata.parent = element
                    /**
                     * The outer list is built before the parent element exists, so it
                     * cannot see `isMultiRemote` yet. Copy it from the resolved element
                     * and from the list that element returns.
                     */
                    if (element?.isMultiRemote) {
                        metadata.isMultiRemote = true
                    }
                    const command = element?.[commandName]
                    if (typeof command !== 'function') {
                        return []
                    }
                    const query = command as (
                        this: unknown,
                        ...params: unknown[]
                    ) => Promise<{ isMultiRemote?: boolean } & unknown[]>
                    const queried = await query.call(element, ...args)
                    if (queried?.isMultiRemote) {
                        metadata.isMultiRemote = true
                    }
                    return Array.isArray(queried) ? queried : []
                }, metadata)
            }

            if (!isChainedPromise) {
                const result = fn.apply(this, args)
                if (result && typeof result[ELEMENT_ARRAY_WRAP] === 'function') {
                    attachElementArrayHooks.call(this, result, commandName, args)
                    return result
                }

                /**
                 * A command with an element-list name that does not return an
                 * ElementArray (an async `overwriteCommand`, test doubles) keeps the
                 * promise proxy. A promise is a pending element list by its name, see
                 * `kind.ts`. A value that is not a promise is known, and it is not an
                 * ElementArray, so it gets no `wdio.kind` brand.
                 */
                const isPending = typeof (result as { then?: unknown } | undefined)?.then === 'function'
                return createElementPromiseProxy(
                    Promise.resolve(result),
                    function (this: unknown) {
                        return this
                    },
                    [],
                    commandName,
                    undefined,
                    isPending ? 'element-array' : undefined,
                    isMultiRemoteOrigin(this)
                )
            }
        }

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
export async function executeAsync(
    this: WebdriverIOInstance,
    fn: Function,
    retries: Frameworks.TestRetries,
    args: unknown[] = [],
    timeout: number = 20000
): Promise<unknown> {
    this.wdioRetries = retries.attempts

    let done = false
    let timer: ReturnType<typeof setTimeout> | undefined

    try {
        /**
         * To prevent test failures due to timeout exceptions in Jasmine from overwriting test objects with subsequent values,
         * we reduce the overall timeout by a constant known as TIME_BUFFER. TIME_BUFFER acts as a safety margin, allowing a small
         * window of time for an operation to complete before triggering a timeout. This approach ensures that test results are handled
         * properly without affecting the overall test execution timing.
         */
        // @ts-expect-error - _runnable is set by Mocha/Jasmine at runtime
        const runnable = this?._runnable
        const runnableTimeout = runnable?._timeout
        // @ts-expect-error - jasmine is set by Jasmine at runtime
        const frameworkTimeout = runnableTimeout ?? globalThis.jasmine?.DEFAULT_TIMEOUT_INTERVAL ?? timeout
        const _timeout = (frameworkTimeout ?? timeout) - TIME_BUFFER
        // Capture the identity before execution, as the framework may advance to another runnable on timeout.
        const fullTitle = typeof runnable?.fullTitle === 'function' ? runnable.fullTitle() : undefined
        const testTitle = fullTitle || runnable?.title || fn.name || 'unknown test or hook'
        const attempt = retries.attempts + 1
        const totalAttempts = retries.limit + 1
        /**
         * Executes the function with specified timeout and returns the result, or throws an error if the timeout is exceeded.
         */
        const result = await Promise.race([
            fn.apply(this, args),
            new Promise<void>((resolve, reject) => {
                timer = setTimeout(() => {
                    if (done) {
                        resolve()
                    } else {
                        reject(new Error(`Timeout after ${_timeout}ms in ${JSON.stringify(testTitle)} (WDIO attempt ${attempt}/${totalAttempts})`))
                    }
                }, _timeout)
            })
        ])
        done = true
        if (timer) {
            clearTimeout(timer)
        }

        if (result !== null && typeof result === 'object' && 'finally' in result && typeof result.finally === 'function') {
            result.catch((err: unknown) => err)
        }

        return await result
    } catch (err) {
        done = true
        /**
         * ensure we don't leak the timeout timer into follow-up retries
         */
        if (timer) {
            clearTimeout(timer)
        }
        if (retries.limit > retries.attempts) {
            retries.attempts++
            return await executeAsync.call(this, fn, retries, args, timeout)
        }

        throw err
    }
}
