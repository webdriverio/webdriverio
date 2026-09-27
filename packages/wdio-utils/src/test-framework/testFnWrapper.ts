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
    { specFn, specFnArgs, frameworkResult: readFrameworkResult }: SpecFunction,
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

    /**
     * Snapshot the runnable identity BEFORE running the spec/hook body.
     *
     * On a timeout, the framework's own race timer can fire fractionally before the framework
     * records the failure, after which the framework synchronously advances its runnable pointer
     * to the NEXT runnable. The awaited continuation below would then read a stale `context.test`
     * and emit the after-hook with the WRONG (next) identity, leaving the runnable that actually
     * timed out without a matching finish event.
     *
     * `afterFnArgs(this)` returns `[identityObject, context]` (see HookFnArgs). We capture that
     * array here and reuse its identity element (index 0) at emit time; the result/error/duration
     * args are still computed post-await, so result data stays accurate. Framework-agnostic: this
     * path also serves jasmine, and `afterFnArgs` is guarded in case it is undefined.
     */
    const identitySnapshot = typeof afterFnArgs === 'function' ? afterFnArgs(this) : undefined

    let result
    let error: { stack?: string, matcherName?: string } | undefined
    let skip = false
    let autoSkipError: unknown

    const testStart = Date.now()
    try {
        result = await executeAsync.call(this, specFn, retries, specFnArgs, timeout)
        const frameworkResult = readFrameworkResult?.()
        if (frameworkResult) {
            if (frameworkResult.result !== undefined) {
                result = frameworkResult.result
            }
            const frameworkError = frameworkResult.errors?.[0]
            if (frameworkError) {
                if (typeof frameworkError.stack === 'string') {
                    frameworkError.stack = filterStackTrace(frameworkError.stack)
                }
                error = frameworkError
            }
        }
    } catch (_err: unknown) {
        /**
         * To address skipping tests for Mocha and Jasmine
         */
        const errMessage = _err instanceof Error
            ? _err.message
            : (typeof _err === 'string' ? _err : '')
        const isFrameworkSkip = (
            errMessage.includes('sync skip; aborting execution') ||
            errMessage.includes('marked Pending')
        )
        if (!isFrameworkSkip) {
            const err = _err instanceof Error
                ? _err
                : new Error(
                    typeof _err === 'string'
                        ? _err
                        : `An unknown error occurred: ${JSON.stringify(_err)}`
                )
            if (err.stack) {
                err.stack = filterStackTrace(err.stack)
            }

            error = err
        } else {
            skip = true
            autoSkipError = _err
        }
    }
    const duration = Date.now() - testStart
    /**
     * Reuse the pre-await identity snapshot so a timed-out runnable reports its OWN identity.
     *
     * The snapshot is `[identityObject, context]`. We keep the snapshotted identity (index 0,
     * the `{...context.test, parent}` object that may have gone stale post-await) but re-read the
     * live `context` (index 1) so anything the after-hook derives from the live framework context
     * stays current. If `afterFnArgs` was undefined we fall back to an empty args array.
     *
     * `identitySnapshot` and `liveAfterArgs` both come from the same `afterFnArgs` callback, so when
     * it is a function they share the same 2-tuple shape — `slice(1)` can never drop a context that
     * was present; and when it is not a function both are absent (`undefined`/`[]`), so this branch
     * is not taken and no context is lost.
     */
    const liveAfterArgs = typeof afterFnArgs === 'function' ? afterFnArgs(this) : []
    const afterArgs = (identitySnapshot && identitySnapshot.length > 0)
        ? [identitySnapshot[0], ...liveAfterArgs.slice(1)]
        : liveAfterArgs
    afterArgs.push({
        retries,
        error,
        result,
        duration,
        passed: !error && !skip,
        skipped: skip
    })

    if (type === 'Hook' && hookName) {
        afterArgs.push(hookName)
    }

    await logHookError(`After${type}`, await executeHooksWithArgs(`after${type}`, afterFn, [...afterArgs]), cid)

    if (error && !error.matcherName) {
        throw error
    }
    if (skip && autoSkipError) {
        throw autoSkipError
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
