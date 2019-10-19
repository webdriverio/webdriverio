import { isFunctionAsync } from '../utils'
import { logHookError } from './errorHandler'
import { executeHooksWithArgs, executeAsync, runSync } from '../shim'

/**
 * Wrap test framework spec/hook function with WebdriverIO `before`/`after` hooks.
 *
 * @param   {string} type           - Test/Step or Hook
 * @param   {object} spec           - SpecFn and specFnArgs
 * @param   {object} before         - BeforeFn and beforeFnArgs
 * @param   {object} after          - AfterFn and afterFnArgs
 * @param   {string} cid            - Cid
 * @param   {number} repeatTest     - Number of retries if test fails
 * @return  {*}                     - SpecFn result
 */
export const testFnWrapper = function (...args) {
    return testFrameworkFnWrapper.call(this, { executeHooksWithArgs, executeAsync, runSync }, ...args)
}

/**
 * Wrap test framework spec/hook function with WebdriverIO `before`/`after` hooks.
 *
 * @param   {object} wrapFunctions  - executeHooksWithArgs, executeAsync, runSync
 * @param   {string} type           - Test/Step or Hook
 * @param   {object} spec           - specFn and specFnArgs array
 * @param   {object} before         - beforeFn and beforeFnArgs function
 * @param   {object} after          - afterFn and afterFnArgs function
 * @param   {string} cid            - cid
 * @param   {number} repeatTest     - number of retries if test fails
 * @return  {*}                     - specFn result
 */
export const testFrameworkFnWrapper = async function (
    { executeHooksWithArgs, executeAsync, runSync },
    type,
    { specFn, specFnArgs },
    { beforeFn, beforeFnArgs },
    { afterFn, afterFnArgs },
    cid, repeatTest = 0) {
    const beforeArgs = mochaJasmineCompatibility(beforeFnArgs(this), this)
    await logHookError(`Before${type}`, await executeHooksWithArgs(beforeFn, beforeArgs), cid)

    let promise
    let result
    let error
    /**
     * User wants to handle async command with Promises.
     * No need to wrap in a Fiber context.
     */
    if (isFunctionAsync(specFn) || !runSync) {
        promise = executeAsync.call(this, specFn, repeatTest, specFnArgs)
    } else {
        promise = new Promise(runSync.call(this, specFn, repeatTest, specFnArgs))
    }

    const testStart = Date.now()
    try {
        result = await promise
    } catch (err) {
        error = err
    }
    const duration = Date.now() - testStart

    let afterArgs = afterFnArgs(this)
    afterArgs.push({
        error,
        result,
        duration,
        passed: !error
    })

    /**
     * Avoid breaking changes in hook function signatures.
     */
    afterArgs = mochaJasmineCompatibility(afterArgs, this)
    afterArgs = mochaJasmineResultCompatibility(afterArgs, error, duration)
    afterArgs = cucumberCompatibility(afterArgs)

    await logHookError(`After${type}`, await executeHooksWithArgs(afterFn, [...afterArgs]), cid)

    if (error) {
        throw error
    }
    return result
}

/**
 * Avoid breaking signature changes for Mocha and Jasmine frameworks.
 * @param {Array}   hookArgs - Args array
 * @param {object=} context  - Mocha context
 */
const mochaJasmineCompatibility = (hookArgs, { test = {} } = {}) => {
    let args = hookArgs
    if (hookArgs.length < 4 && hookArgs[0] && typeof hookArgs[0] === 'object') {
        // jasmine's title
        if (!args[0].title) {
            args[0].title = args[0].description
        }

        args[0].fullTitle =
            // mocha fullTitle
            test.fullTitle ? test.fullTitle() :
                // jasmine fullName
                hookArgs[0].fullName ? hookArgs[0].fullName :
                    // no fullTitle
                    undefined
    }
    return args
}

/**
 * Avoid breaking signature changes for Mocha and Jasmine frameworks.
 * @param {Array} afterArgs         - Args array
 * @param {Error|undefined} error   - Error
 * @param {number} duration         - Duration
 */
const mochaJasmineResultCompatibility = (afterArgs, error, duration) => {
    let args = afterArgs
    if (afterArgs.length === 3 && afterArgs[0] && typeof afterArgs[0] === 'object') {
        args = [{
            ...afterArgs[0],
            error,
            duration,
            passed: !error,
        }, ...afterArgs.slice(1)]
    }
    return args
}

/**
 * Avoid breaking signature changes for Cucumber framework.
 * @param {Array} afterArgs - Args array
 */
const cucumberCompatibility = (afterArgs) => {
    let args = afterArgs
    if (afterArgs.length === 5) {
        args = [...afterArgs.slice(0, 2), afterArgs[4], ...afterArgs.slice(2, 4)]
    }
    return args
}
