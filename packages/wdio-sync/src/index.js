import Fiber from 'fibers'
import logger from '@wdio/logger'

import executeHooksWithArgs from './executeHooksWithArgs'
import runFnInFiberContext from './runFnInFiberContext'
import runFnInFiberContextWithCallback from './runFnInFiberContextWithCallback'
import wrapCommand from './wrapCommand'

import { STACKTRACE_FILTER_FN } from './constants'
import { filterSpecArgs } from './utils'

const log = logger('@wdio/sync')

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
    // commandIsRunning = false

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
 * @param  {String}   fnName               spec function that is being overwritten
 * @param  {Function} origFn               original framework function
 * @param  {String[]} testInterfaceFnNames command that runs specs, e.g. `it`, `it.only` or `fit`
 * @param  {Function} before               before hook hook
 * @param  {Function} after                after hook hook
 * @return {Function}                      wrapped test/hook function
 */
const wrapTestFunction = function (fnName, origFn, testInterfaceFnNames, before, after) {
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
 * @param  {String[]} testInterfaceFnNames command that runs specs, e.g. `it`, `it.only` or `fit`
 * @param  {Function} before               before hook hook
 * @param  {Function} after                after hook hook
 * @param  {String}   fnName               test interface command to wrap, e.g. `beforeEach`
 * @param  {Object}   scope                the scope to run command from, defaults to global
 */
const runTestInFiberContext = function (testInterfaceFnNames, before, after, fnName, scope = global) {
    const origFn = scope[fnName]
    scope[fnName] = wrapTestFunction(fnName, origFn, testInterfaceFnNames, before, after)

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
        scope[fnName].only = wrapTestFunction(fnName + '.only', origOnlyFn, testInterfaceFnNames, before, after)
    }
}

export {
    executeHooksWithArgs,
    wrapCommand,
    runTestInFiberContext,
    runFnInFiberContext,
    runFnInFiberContextWithCallback,
    executeSync,
    executeAsync
}
