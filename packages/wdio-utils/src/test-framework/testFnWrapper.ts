import { logHookError } from './errorHandler.js'
import { executeHooksWithArgs, executeAsync } from '../shim.js'

import type {
    WrapperMethods,
    SpecFunction,
    BeforeHookParam,
    AfterHookParam
} from './types.js'

const STACKTRACE_FILTER = [
    'node_modules/webdriver/',
    'node_modules/webdriverio/',
    'node_modules/@wdio/',
    '(internal/process/task',
]

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
export const testFnWrapper = function (
    this: unknown,
    ...args: [
        string,
        SpecFunction,
        BeforeHookParam<unknown>,
        AfterHookParam<unknown>,
        string,
        number
    ]
) {
    return testFrameworkFnWrapper.call(this, { executeHooksWithArgs, executeAsync }, ...args)
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
    this: unknown,
    { executeHooksWithArgs, executeAsync }: WrapperMethods,
    type: string,
    { specFn, specFnArgs }: SpecFunction,
    { beforeFn, beforeFnArgs }: BeforeHookParam<unknown>,
    { afterFn, afterFnArgs }: AfterHookParam<unknown>,
    cid: string,
    repeatTest = 0
) {
    const retries = { attempts: 0, limit: repeatTest }
    const beforeArgs = beforeFnArgs(this)
    await logHookError(`Before${type}`, await executeHooksWithArgs(`before${type}`, beforeFn, beforeArgs), cid)

    let result
    let error

    const testStart = Date.now()
    try {
        result = await executeAsync.call(this, specFn, retries, specFnArgs)
    } catch (err: any) {
        if (err.stack) {
            err.stack = filterStackTrace(err.stack)
        }

        error = err
    }
    const duration = Date.now() - testStart
    const afterArgs = afterFnArgs(this)

    afterArgs.push({
        retries,
        error,
        result,
        duration,
        passed: !error
    })

    await logHookError(`After${type}`, await executeHooksWithArgs(`after${type}`, afterFn, [...afterArgs]), cid)

    if (error && !error.matcherName) {
        throw error
    }
    return result
}

/**
 * Filter out internal stacktraces. exporting to allow testing of the function
 * @param   {string} stack Stacktrace
 * @returns {string}
 */
export const filterStackTrace = (stack: string): string => {
    return stack
        .split('\n')
        .filter(line => !STACKTRACE_FILTER.some(l => line.includes(l)))
        .join('\n')
}
