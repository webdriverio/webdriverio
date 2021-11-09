import Fiber from './fibers'
import logger from '@wdio/logger'

const log = logger('@wdio/sync')

/**
 * Helper method to execute a row of hooks with certain parameters.
 * It will return with a reject promise due to a design decision to not let hooks/service intefer the
 * actual test process.
 *
 * @param  {Function|Function[]} hooks  list of hooks
 * @param  {Object[]} args  list of parameter for hook functions
 * @return {Promise}  promise that gets resolved once all hooks finished running
 */
export default async function executeHooksWithArgs (hookName?: string, hooks: Function | Function[] = [], args?: any | undefined) {
    /**
     * make sure hooks are an array of functions
     */
    if (typeof hooks === 'function') {
        hooks = [hooks]
    }

    /**
     * make sure args is an array since we are calling apply
     */
    if (!Array.isArray(args)) {
        args = [args]
    }

    const hookPromise = hooks.map((hook) => new Promise((resolve) => {
        let result

        const execHook = () => {
            delete global.browser._NOT_FIBER

            try {
                result = hook.apply(null, args)
            } catch (err: any) {
                log.error(err.stack)
                return resolve(err)
            }
            if (result && typeof result.then === 'function') {
                return result.then(resolve, (err: Error) => {
                    log.error(err.stack)
                    resolve(err)
                })
            }

            resolve(result)
        }

        /**
         * after command hooks require additional Fiber environment
         */
        return hook.constructor.name === 'AsyncFunction' ? execHook() : Fiber(execHook).run()
    }))

    const start = Date.now()
    const result = await Promise.all(hookPromise)
    if (hookPromise.length) {
        log.debug(`Finished to run "${hookName}" hook in ${Date.now() - start}ms`)
    }

    return result
}
