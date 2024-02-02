import { logHookError } from './errorHandler.js'
import { executeHooksWithArgs, executeAsync } from '../shim.js'

import type {
    WrapperMethods,
    SpecFunction,
    BeforeHookParam,
    AfterHookParam
} from './types.js'

declare global {
    // Firstly variable '_wdioDynamicJasmineResultErrorList' gets reference to test result in packages/wdio-jasmine-framework/src/index.ts and then used here in wdio-utils/ as workaround for Jasmine
    // eslint-disable-next-line no-var
    var _wdioDynamicJasmineResultErrorList: any | undefined
    // eslint-disable-next-line no-var
    var _jasmineTestResult: any | undefined
}

const STACKTRACE_FILTER = [
    'node_modules/webdriver/',
    'node_modules/webdriverio/',
    'node_modules/@wdio/',
    '(internal/process/task',
    '(node:internal/process/task'
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
 * @param   {string} hookName       the hook name
 * @param   {number} timeout        the maximum time (in milliseconds) to wait for
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
        number,
        string?,
        number?
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
 * @param   {string} hookName       the hook name
 * @param   {number} timeout        the maximum time (in milliseconds) to wait for
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
    repeatTest = 0,
    hookName?: string,
    timeout?: number
) {
    const retries = { attempts: 0, limit: repeatTest }
    const beforeArgs = beforeFnArgs(this)
    if (type === 'Hook' && hookName) {
        beforeArgs.push(hookName)
    }
    await logHookError(`Before${type}`, await executeHooksWithArgs(`before${type}`, beforeFn, beforeArgs), cid)

    let result
    let error

    const testStart = Date.now()
    try {
        result = await executeAsync.call(this, specFn, retries, specFnArgs, timeout)
        if (globalThis._jasmineTestResult !== undefined) {
            result = globalThis._jasmineTestResult
            globalThis._jasmineTestResult = undefined
        }

        if (globalThis._wdioDynamicJasmineResultErrorList?.length > 0) {
            globalThis._wdioDynamicJasmineResultErrorList[0].stack = filterStackTrace(globalThis._wdioDynamicJasmineResultErrorList[0].stack)
            error = globalThis._wdioDynamicJasmineResultErrorList[0]
            globalThis._wdioDynamicJasmineResultErrorList = undefined
        }
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

    if (type === 'Hook' && hookName) {
        afterArgs.push(hookName)
    }

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
        .map(line => line.replace(/\?invalidateCache=(\d\.\d+|\d)/g, ''))
        .join('\n')
}
