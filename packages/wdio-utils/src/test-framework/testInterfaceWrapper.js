/**
 * used to wrap mocha, jasmine test frameworks functions (`it`, `beforeEach` and other)
 * with WebdriverIO before/after Test/Hook hooks.
 * Entrypoint is `runTestInFiberContext`, other functions are exported for testing purposes.
 *
 * NOTE: not used by cucumber test framework. `testFnWrapper` is called directly there
 */

import { filterSpecArgs } from '../utils'
import { testFnWrapper } from './testFnWrapper'

const MOCHA_COMMANDS = ['skip', 'only']

/**
 * runs a hook within fibers context (if function name is not async)
 * it also executes before/after hook
 *
 * @param  {Function} hookFn        function that was passed to the framework hook
 * @param  {Function} origFn        original framework hook function
 * @param  {Function} beforeFn      before hook
 * @param  {Function} beforeFnArgs  function that returns args for `beforeFn`
 * @param  {Function} afterFn       after hook
 * @param  {Function} afterArgsFn   function that returns args for `afterFn`
 * @param  {String}   cid           cid
 * @param  {Number}   repeatTest    number of retries if hook fails
 * @return {Function}               wrapped framework hook function
 */
export const runHook = function (hookFn, origFn, beforeFn, beforeFnArgs, afterFn, afterFnArgs, cid, repeatTest) {
    return origFn(function (...hookFnArgs) {
        return testFnWrapper.call(this, 'Hook', { specFn: hookFn, specFnArgs: filterSpecArgs(hookFnArgs) }, { beforeFn, beforeFnArgs }, { afterFn, afterFnArgs }, cid, repeatTest)
    })
}

/**
 * runs a spec function (test function) within the fibers context
 *
 * @param  {string}   specTitle     test description
 * @param  {Function} specFn        test function that got passed in from the user
 * @param  {Function} origFn        original framework test function
 * @param  {Function} beforeFn      before hook
 * @param  {Function} beforeFnArgs  function that returns args for `beforeFn`
 * @param  {Function} afterFn       after hook
 * @param  {Function} afterFnArgs   function that returns args for `afterFn`
 * @param  {String}   cid           cid
 * @param  {Number}   repeatTest    number of retries if test fails
 * @return {Function}               wrapped test function
 */
export const runSpec = function (specTitle, specFn, origFn, beforeFn, beforeFnArgs, afterFn, afterFnArgs, cid, repeatTest) {
    return origFn(specTitle, function (...specFnArgs) {
        return testFnWrapper.call(this, 'Test', { specFn, specFnArgs: filterSpecArgs(specFnArgs) }, { beforeFn, beforeFnArgs }, { afterFn, afterFnArgs }, cid, repeatTest)
    })
}

/**
 * wraps hooks and test function of a framework within a fiber context
 *
 * @param  {Function} origFn               original framework function
 * @param  {String[]} testInterfaceFnNames command that runs specs, e.g. `it`, `it.only` or `fit`
 * @param  {Function} beforeFn             before hook
 * @param  {Function} beforeFnArgs         function that returns args for `beforeFn`
 * @param  {Function} afterFn              after hook
 * @param  {Function} afterArgsFn          function that returns args for `afterFn`
 * @param  {String}   cid                  cid
 * @return {Function}                      wrapped test/hook function
 */
export const wrapTestFunction = function (origFn, isSpec, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid) {
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

        if (isSpec) {
            if (specFn) return runSpec(specTitle, specFn, origFn, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid, retryCnt)

            /**
             * if specFn is undefined we are dealing with a pending function
             */
            return origFn(specTitle)
        }

        return runHook(specFn, origFn, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid, retryCnt)
    }
}

/**
 * Wraps global test function like `it` so that commands can run synchronouse
 *
 * The scope parameter is used in the qunit framework since all functions are bound to global.QUnit instead of global
 *
 * @param  {boolean}  isTest        is `origFn` test function, otherwise hook
 * @param  {Function} beforeFn      before hook
 * @param  {Function} beforeFnArgs  function that returns args for `beforeFn`
 * @param  {Function} afterFn       after hook
 * @param  {Function} afterArgsFn   function that returns args for `afterFn`
 * @param  {String}   fnName        test interface command to wrap, e.g. `beforeEach`
 * @param  {String}   cid           cid
 * @param  {Object}   scope         the scope to run command from, defaults to global
 */
export const runTestInFiberContext = function (isSpec, beforeFn, beforeArgsFn, afterFn, afterArgsFn, fnName, cid, scope = global) {
    const origFn = scope[fnName]
    scope[fnName] = wrapTestFunction(origFn, isSpec, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid)
    addMochaCommands(origFn, scope[fnName])
}

/**
 * support `it.skip` and `it.only` for the Mocha framework
 * @param {Function} origFn original function
 * @param {function} newFn  wrapped function
 */
function addMochaCommands (origFn, newFn) {
    MOCHA_COMMANDS.forEach((commandName) => {
        if (typeof origFn[commandName] === 'function') {
            newFn[commandName] = origFn[commandName]
        }
    })
}
