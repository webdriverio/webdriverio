/**
 * used to wrap mocha, jasmine test frameworks functions (`it`, `beforeEach` and other)
 * with WebdriverIO before/after Test/Hook hooks.
 * Entrypoint is `runTestInFiberContext`, other functions are exported for testing purposes.
 *
 * NOTE: not used by cucumber test framework. `testFnWrapper` is called directly there
 */

import { filterSpecArgs } from '../utils'
import { testFnWrapper } from './testFnWrapper'

import type {
    HookFnArgs,
    SpecFunction,
    BeforeHookParam,
    AfterHookParam,
    SpecArguments
} from './types'

const MOCHA_COMMANDS: ['skip', 'only'] = ['skip', 'only']

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
export const runHook = function (
    this: unknown,
    hookFn: Function,
    origFn: Function,
    beforeFn: Function | Function[],
    beforeFnArgs: HookFnArgs<unknown>,
    afterFn: Function | Function[],
    afterFnArgs: HookFnArgs<unknown>,
    cid: string,
    repeatTest: number
) {
    return origFn(function (
        this: unknown,
        ...hookFnArgs: [
            string,
            SpecFunction,
            BeforeHookParam<unknown>,
            AfterHookParam<unknown>,
            string,
            number
        ]
    ) {
        return testFnWrapper.call(
            this,
            'Hook',
            {
                specFn: hookFn,
                specFnArgs: filterSpecArgs(hookFnArgs)
            },
            {
                beforeFn,
                beforeFnArgs
            },
            {
                afterFn,
                afterFnArgs
            },
            cid,
            repeatTest
        )
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
export const runSpec = function (
    this: unknown,
    specTitle: string,
    specFn: Function,
    origFn: Function,
    beforeFn: Function | Function[],
    beforeFnArgs: HookFnArgs<unknown>,
    afterFn: Function | Function[],
    afterFnArgs: HookFnArgs<unknown>,
    cid: string,
    repeatTest: number
) {
    return origFn(specTitle, function (
        this: unknown,
        ...specFnArgs: [
            string,
            SpecFunction,
            BeforeHookParam<unknown>,
            AfterHookParam<unknown>,
            string,
            number
        ]
    ) {
        return testFnWrapper.call(
            this,
            'Test',
            {
                specFn,
                specFnArgs: filterSpecArgs(specFnArgs)
            },
            {
                beforeFn,
                beforeFnArgs
            },
            {
                afterFn,
                afterFnArgs
            },
            cid,
            repeatTest
        )
    })
}

/**
 * wraps hooks and test function of a framework within a fiber context
 *
 * @param  {Function} origFn               original framework function
 * @param  {Boolean}  isSpec               whether or not origFn is a spec
 * @param  {String[]} testInterfaceFnNames command that runs specs, e.g. `it`, `it.only` or `fit`
 * @param  {Function} beforeFn             before hook
 * @param  {Function} beforeFnArgs         function that returns args for `beforeFn`
 * @param  {Function} afterFn              after hook
 * @param  {Function} afterArgsFn          function that returns args for `afterFn`
 * @param  {String}   cid                  cid
 * @return {Function}                      wrapped test/hook function
 */
export const wrapTestFunction = function (
    this: unknown,
    origFn: Function,
    isSpec: boolean,
    beforeFn: Function | Function[],
    beforeArgsFn: HookFnArgs<unknown>,
    afterFn: Function | Function[],
    afterArgsFn: HookFnArgs<unknown>,
    cid: string
) {
    return function (...specArguments: SpecArguments) {
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
            if (specFn) {
                return runSpec(
                    specTitle as string,
                    specFn as Function,
                    origFn,
                    beforeFn,
                    beforeArgsFn,
                    afterFn,
                    afterArgsFn,
                    cid,
                    retryCnt as number
                )
            }

            /**
             * if specFn is undefined we are dealing with a pending function
             */
            return origFn(specTitle)
        }

        return runHook(specFn as Function, origFn, beforeFn, beforeArgsFn, afterFn, afterArgsFn, cid, retryCnt as number)
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
export const runTestInFiberContext = function (
    this: unknown,
    isSpec: boolean,
    beforeFn: Function | Function[],
    beforeArgsFn: HookFnArgs<unknown>,
    afterFn: Function | Function[],
    afterArgsFn: HookFnArgs<unknown>,
    fnName: string,
    cid: string,
    scope = global) {
    const origFn = (scope as any)[fnName];
    (scope as any)[fnName] = wrapTestFunction(
        origFn,
        isSpec,
        beforeFn,
        beforeArgsFn,
        afterFn,
        afterArgsFn,
        cid
    )
    addMochaCommands(origFn, (scope as any)[fnName])
}

type ItFn = {
    (): ItFn
    skip: Function
    only: Function
}

/**
 * support `it.skip` and `it.only` for the Mocha framework
 * @param {Function} origFn original function
 * @param {function} newFn  wrapped function
 */
function addMochaCommands (origFn: ItFn, newFn: ItFn) {
    MOCHA_COMMANDS.forEach((commandName: 'skip' | 'only') => {
        if (typeof origFn[commandName] === 'function') {
            newFn[commandName] = origFn[commandName]
        }
    })
}
