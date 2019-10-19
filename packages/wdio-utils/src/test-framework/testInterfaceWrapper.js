/**
 * @fileoverview Used to wrap Mocha, Jasmine test frameworks functions (`it`, `beforeEach`, 
 * and others) with WebdriverIO before/after Test/Hook hooks.
 *
 * Entrypoint is `runTestInFiberContext`. Other functions are exported for testing purposes.
 *
 * NOTE: Not used by the Cucumber test framework. `testFnWrapper` is called directly there.
 */

import { filterSpecArgs } from '../utils'
import { testFnWrapper } from './testFnWrapper'

const MOCHA_COMMANDS = ['skip', 'only']

/**
 * Runs a hook within the fibers context (if function name is not async).
 * Also executes `before`/`after` hooks.
 *
 * @param  {Function} hookFn        - Function that was passed to the framework hook
 * @param  {Function} origFn        - Original framework hook function
 * @param  {Function} beforeFn      - Before hook
 * @param  {Function} beforeFnArgs  - Function that returns args for `beforeFn`
 * @param  {Function} afterFn       - After hook
 * @param  {Function} afterArgsFn   - Function that returns args for `afterFn`
 * @param  {String}   cid           - Cid
 * @param  {Number}   repeatTest    - Number of retries if hook fails
 * @return {Function}               - Wrapped framework hook function
 */
export const runHook = function (hookFn, origFn, beforeFn, beforeFnArgs, afterFn, afterFnArgs, cid, repeatTest = 0) {
    return origFn(function (...hookFnArgs) {
        return testFnWrapper.call(this, 'Hook', { specFn: hookFn, specFnArgs: filterSpecArgs(hookFnArgs) }, { beforeFn, beforeFnArgs }, { afterFn, afterFnArgs }, cid, repeatTest)
    })
}

/**
 * Runs a spec function (test function) within the fibers context.
 *
 * @param  {string}   specTitle     - Test description
 * @param  {Function} specFn        - Test function that got passed in from the user
 * @param  {Function} origFn        - Original framework test function
 * @param  {Function} beforeFn      - Before hook
 * @param  {Function} beforeFnArgs  - Function that returns args for `beforeFn`
 * @param  {Function} afterFn       - After hook
 * @param  {Function} afterFnArgs   - Function that returns args for `afterFn`
 * @param  {String}   cid           - Cid
 * @param  {Number}   repeatTest    - Number of retries if test fails
 * @return {Function}               - Wrapped test function
 */
export const runSpec = function (specTitle, specFn, origFn, beforeFn, beforeFnArgs, afterFn, afterFnArgs, cid, repeatTest = 0) {
    return origFn(specTitle, function (...specFnArgs) {
        return testFnWrapper.call(this, 'Test', { specFn, specFnArgs: filterSpecArgs(specFnArgs) }, { beforeFn, beforeFnArgs }, { afterFn, afterFnArgs }, cid, repeatTest)
    })
}

/**
 * Wraps a framework’s hook or test function within a fiber context.
 *
 * @param  {Function} origFn               - Original framework function
 * @param  {String[]} testInterfaceFnNames - Command that runs specs, e.g. `it`, `it.only` or `fit`
 * @param  {Function} beforeFn             - Before hook
 * @param  {Function} beforeFnArgs         - Function that returns args for `beforeFn`
 * @param  {Function} afterFn              - After hook
 * @param  {Function} afterArgsFn          - Function that returns args for `afterFn`
 * @param  {String}   cid                  - Cid
 * @return {Function}                      - Wrapped test/hook function
 */
export const wrapTestFunction = function (origFn, isSpec, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid) {
    return function (...specArguments) {
        /**
         * Variadic arguments:
         * 
         * [title, fn], [title], [fn]
         * [title, fn, retryCnt], [title, retryCnt], [fn, retryCnt]
         */
        let retryCnt = typeof specArguments[specArguments.length - 1] === 'number' ? specArguments.pop() : 0
        const specFn = typeof specArguments[0] === 'function' ? specArguments.shift()
            : (typeof specArguments[1] === 'function' ? specArguments.pop() : undefined)
        const specTitle = specArguments[0]

        if (isSpec) {
            if (specFn) return runSpec(specTitle, specFn, origFn, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid, retryCnt)

            /**
             * If specFn is undefined, we are dealing with a pending function
             */
            return origFn(specTitle)
        }

        return runHook(specFn, origFn, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid, retryCnt)
    }
}

/**
 * Wraps global test functions (like `it`) so that commands can run synchronously.
 *
 * The `scope` parameter is used by the QUnit framework, since all functions are bound to 
 * `global.QUnit` instead of `global`.
 *
 * @param  {boolean}  isTest        - Is `origFn` test function, otherwise hook
 * @param  {Function} beforeFn      - Before hook
 * @param  {Function} beforeFnArgs  - Function that returns args for `beforeFn`
 * @param  {Function} afterFn       - After hook
 * @param  {Function} afterArgsFn   - Function that returns args for `afterFn`
 * @param  {String}   fnName        - Test interface command to wrap, e.g. `beforeEach`
 * @param  {String}   cid           - Cid
 * @param  {Object}   scope         - The scope to run command from, defaults to global
 */
export const runTestInFiberContext = function (isSpec, beforeFn, beforeArgsFn, afterFn, afterArgsFn, fnName, cid, scope = global) {
    const origFn = scope[fnName]
    scope[fnName] = wrapTestFunction(origFn, isSpec, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid)
    addMochaCommands(origFn, scope[fnName])
}

/**
 * Support `it.skip` and `it.only` for the Mocha framework.
 * @param {Function} origFn - Original function
 * @param {function} newFn  - Wrapped function
 */
function addMochaCommands (origFn, newFn) {
    MOCHA_COMMANDS.forEach((commandName) => {
        if (typeof origFn[commandName] === 'function') {
            newFn[commandName] = origFn[commandName]
        }
    })
}
