import Fiber from 'fibers'
import Future from 'fibers/future'
import logger from 'wdio-logger'

import { SYNC_COMMANDS, STACKTRACE_FILTER_FN } from './constants'
import { sanitizeErrorMessage, filterSpecArgs } from './utils'

const log = logger('wdio-sync')

let commandIsRunning = false
let forcePromises = false

/**
 * Helper method to execute a row of hooks with certain parameters.
 * It will return with a reject promise due to a design decision to not let hooks/service intefer the
 * actual test process.
 *
 * @param  {Function|Function[]} hooks  list of hooks
 * @param  {Object[]} args  list of parameter for hook functions
 * @return {Promise}  promise that gets resolved once all hooks finished running
 */
const executeHooksWithArgs = (hooks = [], args) => {
    /**
     * make sure hooks are an array of functions
     */
    if (typeof hooks === 'function') {
        hooks = [hooks]
    }

    /**
     * make sure args is an array since we are calling apply
     */
    if (!Array.isArray(args)) {
        args = [args]
    }

    hooks = hooks.map((hook) => new Promise((resolve) => {
        let _commandIsRunning = commandIsRunning
        let result

        const execHook = () => {
            commandIsRunning = true

            try {
                result = hook.apply(null, args)
            } catch (e) {
                log.error(e.stack)
                return resolve(e)
            } finally {
                commandIsRunning = _commandIsRunning
            }
            if (result && typeof result.then === 'function') {
                return result.then(resolve, (e) => {
                    log.error(e.stack)
                    resolve(e)
                })
            }

            resolve(result)
        }

        /**
         * after command hooks require additional Fiber environment
         */
        return Fiber(execHook).run()
    }))

    return Promise.all(hooks)
}

/**
 * global function to wrap callbacks into Fiber context
 * @param  {Function} fn  function to wrap around
 * @return {Function}     wrapped around function
 */
const wdioSync = global.wdioSync = function (fn, done) {
    return function (...args) {
        return Fiber(() => {
            const result = fn.apply(this, args)

            if (typeof done === 'function') {
                done(result)
            }
        }).run()
    }
}

/**
 * wraps a function into a Fiber ready context to enable sync execution and hooks
 * @param  {Function}   fn             function to be executed
 * @param  {String}     commandName    name of that function
 * @param  {Function[]} beforeCommand  method to be executed before calling the actual function
 * @param  {Function[]} afterCommand   method to be executed after calling the actual function
 * @return {Function}   actual wrapped function
 */
const wrapCommand = function (commandName, fn) {
    return function (...args) {
        const result = fn.apply(this, args)

        /**
         * just retrun result if no async operation was done
         */
        if (!result || typeof result.then !== 'function') {
            return result
        }

        const future = new Future()
        result.then((commandResult) => {
            return future.return(commandResult)
        }, (commandError) => {
            return future.throw(commandError)
        })

        try {
            return future.wait()
        } catch (e) {
            /**
             * in case we run commands where no fiber function was used
             * e.g. when we call deleteSession
             */
            if (e.message.includes(`Can't wait without a fiber`)) {
                return result
            }

            throw e
        }
    }
    /**
     * sync command wrap
     */
    // return function (...commandArgs) {
    //     let future = new Future()
    //     let futureFailed = false
    //
    //     if (forcePromises) {
    //         return fn.apply(this, commandArgs)
    //     }
    //
    //     /**
    //      * don't execute [before/after]Command hook if a command was executed
    //      * in these hooks (otherwise we will get into an endless loop)
    //      */
    //     if (commandIsRunning) {
    //         let commandPromise = fn.apply(this, commandArgs)
    //
    //         /**
    //          * if commandPromise is actually not a promise just return result
    //          */
    //         if (typeof commandPromise.then !== 'function') {
    //             return commandPromise
    //         }
    //
    //         /**
    //          * Try to execute with Fibers and fall back if can't.
    //          * This part is executed when we want to set a fiber context within a command (e.g. in waitUntil).
    //          */
    //         try {
    //             commandPromise.then((commandResult) => {
    //                 /**
    //                  * extend protoype of result so people can call browser.element(...).click()
    //                  */
    //                 future.return(commandResult)
    //             }, future.throw.bind(future))
    //             return future.wait()
    //         } catch (e) {
    //             if (e.message === "Can't wait without a fiber") {
    //                 return commandPromise
    //             }
    //             throw e
    //         }
    //     }
    //
    //     /**
    //      * commands that get executed during waitUntil and debug (repl mode) should always
    //      * handled synchronously, therefor prevent propagating lastResults between single calls
    //      */
    //     if (commandName !== 'waitUntil' && commandName !== 'debug') {
    //         commandIsRunning = true
    //     }
    //
    //     let newInstance = this
    //     let commandResult, commandError
    //     executeHooksWithArgs(beforeCommand, [commandName, commandArgs]).then(() => {
    //         /**
    //          * actual function was already executed in desired catch block
    //          */
    //         if (futureFailed) {
    //             return
    //         }
    //
    //         newInstance = fn.apply(this, commandArgs)
    //         return newInstance.then((result) => {
    //             commandResult = result
    //             return executeHooksWithArgs(afterCommand, [commandName, commandArgs, result])
    //         }, (e) => {
    //             commandError = e
    //             return executeHooksWithArgs(afterCommand, [commandName, commandArgs, null, e])
    //         }).then(() => {
    //             commandIsRunning = false
    //
    //             if (commandError) {
    //                 return future.throw(commandError)
    //             }
    //
    //             wrapCommands(newInstance, beforeCommand, afterCommand)
    //             return future.return(commandResult)
    //         })
    //     })
    //
    //     /**
    //      * try to execute with Fibers and fall back if can't
    //      */
    //     try {
    //         return future.wait()
    //     } catch (e) {
    //         if (e.message === "Can't wait without a fiber") {
    //             futureFailed = true
    //             return fn.apply(this, commandArgs)
    //         }
    //
    //         e.stack = sanitizeErrorMessage(e)
    //         throw e
    //     }
    // }
}

/**
 * wraps all WebdriverIO commands
 * @param  {Object}     instance       WebdriverIO client instance (browser)
 * @param  {Function[]} beforeCommand  before command hook
 * @param  {Function[]} afterCommand   after command hook
 */
const wrapCommands = function (instance, beforeCommand, afterCommand) {
    const addCommand = instance.addCommand

    /**
     * if instance is a multibrowser instance make sure to wrap commands
     * of its instances too
     */
    if (instance.isMultiremote) {
        instance.getInstances().forEach((browserName) => {
            wrapCommands(global[browserName], beforeCommand, afterCommand)
        })
    }

    for (const commandName of instance.commandList) {
        if (SYNC_COMMANDS.indexOf(commandName) > -1) {
            return
        }

        let origFn = instance[commandName]
        instance[commandName] = wrapCommand.call(instance, origFn, commandName, beforeCommand, afterCommand)
    }

    /**
     * Adding a command within fiber context doesn't require a special routine
     * since everything runs sync. There is no need to promisify the command.
     */
    instance.addCommand = function (fnName, fn, forceOverwrite) {
        let commandGroup = instance.getPrototype()
        let commandName = fnName
        let namespace

        if (typeof fn === 'string') {
            namespace = arguments[0]
            fnName = arguments[1]
            fn = arguments[2]
            forceOverwrite = arguments[3]

            switch (typeof commandGroup[namespace]) {
            case 'function':
                throw new Error(`Command namespace "${namespace}" is used internally, and can't be overwritten!`)
            case 'undefined':
                commandGroup[namespace] = {}
                break
            }

            commandName = `${namespace}.${fnName}`
            commandGroup = commandGroup[namespace]
        }

        if (commandGroup[fnName] && !forceOverwrite) {
            throw new Error(`Command ${fnName} is already defined!`)
        }

        /**
         * If method name is async the user specifies that he wants to use bare promises to handle asynchronicity.
         * First use native addCommand in order to be able to chain with other native commands, then wrap new
         * command again to run it synchronous in the test method.
         * This will allow us to run async custom commands within sync custom commands in a sync way.
         */
        if (fn.name === 'async') {
            addCommand(fnName, function (...args) {
                const state = forcePromises
                forcePromises = true
                let res = fn.apply(instance, args)
                forcePromises = state
                return res
            }, forceOverwrite)
            commandGroup[fnName] = wrapCommand.call(commandGroup, commandGroup[fnName], fnName, beforeCommand, afterCommand)
            return
        }

        /**
         * for all other cases we internally return a promise that is
         * finished once the Fiber wrapped custom function has finished
         * #functionalProgrammingWTF!
         */
        commandGroup[fnName] = function (...args) {
            return new Promise((resolve) => {
                const state = forcePromises
                forcePromises = false
                wdioSync(fn, resolve).apply(this, args)
                forcePromises = state
            })
        }
        instance[fnName] = wrapCommand.call(commandGroup, commandGroup[fnName], commandName, beforeCommand, afterCommand)
    }
}

/**
 * execute test or hook synchronously
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   repeatTest number of retries
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
const executeSync = function (fn, repeatTest = 0, args = []) {
    /**
     * if a new hook gets executed we can assume that all commands should have finised
     * with exception of timeouts where `commandIsRunning` will never be reset but here
     */
    commandIsRunning = false

    return new Promise((resolve, reject) => {
        try {
            const res = fn.apply(this, args)
            resolve(res)
        } catch (e) {
            if (repeatTest) {
                return resolve(executeSync(fn, --repeatTest, args))
            }

            /**
             * no need to modify stack if no stack available
             */
            if (!e.stack) {
                return reject(e)
            }

            e.stack = e.stack.split('\n').filter(STACKTRACE_FILTER_FN).join('\n')
            reject(e)
        }
    })
}

/**
 * execute test or hook asynchronously
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   repeatTest number of retries
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
const executeAsync = function (fn, repeatTest = 0, args = []) {
    let result, error

    /**
     * if a new hook gets executed we can assume that all commands should have finised
     * with exception of timeouts where `commandIsRunning` will never be reset but here
     */
    commandIsRunning = false

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
     * if we don't retry just return result
     */
    if (repeatTest === 0 || !result || typeof result.catch !== 'function') {
        return new Promise(resolve => resolve(result))
    }

    /**
     * handle promise response
     */
    return result.catch((e) => {
        if (repeatTest) {
            return executeAsync(fn, --repeatTest, args)
        }

        e.stack = e.stack.split('\n').filter(STACKTRACE_FILTER_FN).join('\n')
        return Promise.reject(e)
    })
}

/**
 * runs a hook within fibers context (if function name is not async)
 * it also executes before/after hook hook
 *
 * @param  {Function} hookFn      function that was passed to the framework hook
 * @param  {Function} origFn      original framework hook function
 * @param  {Function} before      before hook hook
 * @param  {Function} after       after hook hook
 * @param  {Number}   repeatTest  number of retries if hook fails
 * @return {Function}             wrapped framework hook function
 */
const runHook = function (hookFn, origFn, before, after, repeatTest = 0) {
    const hookError = (hookName) => (e) => log.error(`Error in ${hookName}: ${e.stack}`)

    return origFn(function (...hookArgs) {
        // Print errors encountered in beforeHook and afterHook to console, but
        // don't propagate them to avoid failing the test. However, errors in
        // framework hook functions should fail the test, so propagate those.
        return executeHooksWithArgs(before).catch(hookError('beforeHook')).then(() => {
            /**
             * user wants handle async command using promises, no need to wrap in fiber context
             */
            if (hookFn.name === 'async') {
                return executeAsync.call(this, hookFn, repeatTest, filterSpecArgs(hookArgs))
            }

            return new Promise(runSync.call(this, hookFn, repeatTest, filterSpecArgs(hookArgs)))
        }).then(() => {
            return executeHooksWithArgs(after).catch(hookError('afterHook'))
        })
    })
}

/**
 * runs a spec function (test function) within the fibers context
 * @param  {string}   specTitle   test description
 * @param  {Function} specFn      test function that got passed in from the user
 * @param  {Function} origFn      original framework test function
 * @param  {Number}   repeatTest  number of retries if test fails
 * @return {Function}             wrapped test function
 */
const runSpec = function (specTitle, specFn, origFn, repeatTest = 0) {
    /**
     * user wants handle async command using promises, no need to wrap in fiber context
     */
    if (specFn.name === 'async') {
        return origFn(specTitle, function async (...specArgs) {
            return executeAsync.call(this, specFn, repeatTest, filterSpecArgs(specArgs))
        })
    }

    return origFn(specTitle, function (...specArgs) {
        return new Promise(runSync.call(this, specFn, repeatTest, filterSpecArgs(specArgs)))
    })
}

/**
 * run hook or spec via executeSync
 */
function runSync (fn, repeatTest = 0, args = []) {
    return (resolve, reject) =>
        Fiber(() => executeSync.call(this, fn, repeatTest, args).then(() => resolve(), reject)).run()
}

/**
 * wraps hooks and test function of a framework within a fiber context
 * @param  {Function} origFn               original framework function
 * @param  {string[]} testInterfaceFnName  actual test functions for that framework
 * @return {Function}                      wrapped test/hook function
 */
const wrapTestFunction = function (fnName, origFn, testInterfaceFnName, before, after) {
    return function (...specArguments) {
        /**
         * Variadic arguments:
         * [title, fn], [title], [fn]
         * [title, fn, retryCnt], [title, retryCnt], [fn, retryCnt]
         */
        let retryCnt = typeof specArguments[specArguments.length - 1] === 'number' ? specArguments.pop() : 0
        const specFn = typeof specArguments[0] === 'function' ? specArguments.shift()
            : (typeof specArguments[1] === 'function' ? specArguments.pop() : undefined)
        const specTitle = specArguments[0]
        const testInterfaceFnNames = [testInterfaceFnName, `${testInterfaceFnName}.only`]

        if (testInterfaceFnNames.indexOf(fnName) > -1) {
            if (specFn) return runSpec(specTitle, specFn, origFn, retryCnt)

            /**
             * if specFn is undefined we are dealing with a pending function
             */
            return origFn(specTitle)
        }

        return runHook(specFn, origFn, before, after, retryCnt)
    }
}

/**
 * Wraps global test function like `it` so that commands can run synchronouse
 *
 * The scope parameter is used in the qunit framework since all functions are bound to global.QUnit instead of global
 *
 * @param  {String[]} testInterfaceFnName  command that runs specs, e.g. `it`
 * @param  {Function} before               before hook hook
 * @param  {Function} after                after hook hook
 * @param  {String}   fnName               test interface command to wrap, e.g. `beforeEach`
 * @param  {Object}   scope                the scope to run command from, defaults to global
 */
const runInFiberContext = function (testInterfaceFnName, before, after, fnName, scope = global) {
    const origFn = scope[fnName]
    scope[fnName] = wrapTestFunction(fnName, origFn, testInterfaceFnName, before, after)

    /**
     * support it.skip for the Mocha framework
     */
    if (typeof origFn.skip === 'function') {
        scope[fnName].skip = origFn.skip
    }

    /**
     * wrap it.only for the Mocha framework
     */
    if (typeof origFn.only === 'function') {
        const origOnlyFn = origFn.only
        scope[fnName].only = wrapTestFunction(fnName + '.only', origOnlyFn, testInterfaceFnName, before, after)
    }
}

export {
    wrapCommand,
    wrapCommands,
    runInFiberContext,
    executeHooksWithArgs,
    executeSync,
    executeAsync,
    wdioSync
}
