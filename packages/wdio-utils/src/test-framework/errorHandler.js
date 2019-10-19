/**
 * Notify `WDIOCLInterface` about a failure in a hook.
 * It must be done this way, because `beforeFn` and `afterFn` are not real hooks.
 * (Otherwise hooks failures would be lost!)
 *
 * @param {string}  hookName    - Name of the hook
 * @param {Array}   hookResults - Hook functions results array
 * @param {string}  cid         - Cid
 */
export const logHookError = (hookName, hookResults = [], cid) => {
    const result = hookResults.find(result => result instanceof Error)
    if (typeof result === 'undefined') {
        return
    }

    /**
     * Convert Error to a plain object, or it will be lost in `process.send`.
     */
    const error = { message: result.message }

    const content = {
        cid: cid,
        error: error,
        fullTitle: `${hookName} Hook`,
        type: 'hook',
        state: 'fail'
    }

    process.send({
        origin: 'reporter',
        name: 'printFailureMessage',
        content
    })
}
