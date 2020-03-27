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
    const beforeArgs = beforeFnArgs(this)
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

    await logHookError(`After${type}`, await executeHooksWithArgs(afterFn, [...afterArgs]), cid)

    if (error) {
        throw error
    }
    return result
}
