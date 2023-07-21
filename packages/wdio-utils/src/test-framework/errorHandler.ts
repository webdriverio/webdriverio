/**
 * notify `WDIOCLInterface` about failure in hook
 * we need to do it this way because `beforeFn` and `afterFn` are not real hooks.
 * Otherwise hooks failures are lost.
 *
 * @param {string}  hookName    name of the hook
 * @param {Array}   hookResults hook functions results array
 * @param {string}  cid         cid
 */
export const logHookError = (hookName: string, hookResults: any[] = [], cid: string) => {
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
