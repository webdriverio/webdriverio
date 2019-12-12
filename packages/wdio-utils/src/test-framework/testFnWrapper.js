import { isFunctionAsync } from '../utils'
import { logHookError } from './errorHandler'
import { executeHooksWithArgs, executeAsync, runSync } from '../shim'

/**
 * wraps test framework spec/hook function with WebdriverIO before/after hooks
 *
 * @param   {string} type           Test/Step or Hook
 * @param   {object} spec           specFn and specFnArgs
 * @param   {object} before         beforeFn and beforeFnArgs
 * @param   {object} after          afterFn and afterFnArgs
 * @param   {string} cid            cid
 * @param   {number} repeatTest     number of retries if test fails
 * @return  {*}                     specFn result
 */
export const testFnWrapper = function (...args) {
    return testFrameworkFnWrapper.call(this, { executeHooksWithArgs, executeAsync, runSync }, ...args)
}

/**
 * wraps test framework spec/hook function with WebdriverIO before/after hooks
 *
 * @param   {object} wrapFunctions  executeHooksWithArgs, executeAsync, runSync
 * @param   {string} type           Test/Step or Hook
 * @param   {object} spec           specFn and specFnArgs array
 * @param   {object} before         beforeFn and beforeFnArgs function
 * @param   {object} after          afterFn and afterFnArgs function
 * @param   {string} cid            cid
 * @param   {number} repeatTest     number of retries if test fails
 * @return  {*}                     specFn result
 */
export const testFrameworkFnWrapper = async function (
    { executeHooksWithArgs, executeAsync, runSync },
    type,
    { specFn, specFnArgs },
    { beforeFn, beforeFnArgs },
    { afterFn, afterFnArgs },
    cid, repeatTest = 0) {
    const retries = { attempts: 0, limit: repeatTest }
    const beforeArgs = mochaJasmineCompatibility(beforeFnArgs(this), this)
    await logHookError(`Before${type}`, await executeHooksWithArgs(beforeFn, beforeArgs), cid)

    let promise
    let result
    let error
    /**
     * user wants handle async command using promises, no need to wrap in fiber context
     */
    if (isFunctionAsync(specFn) || !runSync) {
        promise = executeAsync.call(this, specFn, retries, specFnArgs)
    } else {
        promise = new Promise(runSync.call(this, specFn, retries, specFnArgs))
    }

    const testStart = Date.now()
    try {
        result = await promise
    } catch (err) {
        error = err
    }
    const duration = Date.now() - testStart
    let afterArgs = afterFnArgs(this)

    /**
     * ensure errors are caught in Jasmine tests too
     * (in Jasmine failing assertions are not causing the test to throw as
     * oppose to other common assertion libraries like chai)
     */
    if (!error && afterArgs[0] && afterArgs[0].failedExpectations && afterArgs[0].failedExpectations.length) {
        error = afterArgs[0].failedExpectations[0]
    }

    afterArgs.push({
        retries,
        error,
        result,
        duration,
        passed: !error
    })

    /**
     * avoid breaking changes in hook function signatures
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
 * avoid breaking signature changes for existing mocha and jasmine users
 * @param {Array}   hookArgs args array
 * @param {object=} context mocha context
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
 * avoid breaking signature changes for existing mocha and jasmine users
 * @param {Array} afterArgs args array
 * @param {Error|undefined} error error
 * @param {number} duration duration
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
 * avoid breaking signature changes for existing cucumber users
 * @param {Array} afterArgs args array
 */
const cucumberCompatibility = (afterArgs) => {
    let args = afterArgs
    if (afterArgs.length === 5) {
        args = [...afterArgs.slice(0, 2), afterArgs[4], ...afterArgs.slice(2, 4)]
    }
    return args
}
