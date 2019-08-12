import { isFunctionAsync } from '../utils'
import { logHookError } from './errorHandler'

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
    await logHookError(`Before${type}`, await executeHooksWithArgs(beforeFn, beforeFnArgs(this)), cid)

    let promise
    let result
    let error
    /**
     * user wants handle async command using promises, no need to wrap in fiber context
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

    /**
     * avoid breaking signature changes for existing mocha and jasmine users
     */
    const afterArgs = afterFnArgs(this)
    if (afterArgs[0] && typeof afterArgs[0] === 'object') {
        afterArgs[0] = {
            ...afterArgs[0],
            error,
            duration,
            passed: !error,
        }
    }

    await logHookError(`After${type}`, await executeHooksWithArgs(afterFn, [...afterArgs, {
        error,
        result,
        duration,
        passed: !error
    }]), cid)

    if (error) {
        throw error
    }
    return result
}
