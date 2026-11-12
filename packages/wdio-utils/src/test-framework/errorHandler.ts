/**
 * notify `WDIOCLInterface` about failure in hook
 * we need to do it this way because `beforeFn` and `afterFn` are not real hooks.
 * Otherwise hooks failures are lost.
 *
 * @param {string}  hookName    name of the hook
 * @param {Array}   hookResults hook functions results array
 * @param {string}  cid         cid
 */
export const logHookError = (hookName: string, hookResults: unknown[] = [], cid: string) => {
    const result = hookResults.find(result => result instanceof Error)
    if (typeof result === 'undefined') {
        return
    }

    /**
     * need to convert Error to plain object, otherwise it is lost on process.send
     */
    const error = { message: result.message }

    const content = {
        cid: cid,
        error: error,
        fullTitle: `${hookName} Hook`,
        type: 'hook',
        state: 'fail'
    }

    if (globalThis.process && typeof globalThis.process.send === 'function') {
        globalThis.process.send!({
            origin: 'reporter',
            name: 'printFailureMessage',
            content
        })
    }
}

/**
 * find the first `SevereServiceError` among the results of a hook. It is matched by name
 * as the error class is exported by `webdriverio`, which `@wdio/utils` can't depend on
 * (and a service can bring its own copy of it).
 *
 * @param   {Array}  hookResults hook functions results array
 * @returns {Error=}             the severe error, if any hook threw one
 */
export const findSevereServiceError = (hookResults: unknown[] = []) => {
    return hookResults.find((result): result is Error => result instanceof Error && result.name === 'SevereServiceError')
}
