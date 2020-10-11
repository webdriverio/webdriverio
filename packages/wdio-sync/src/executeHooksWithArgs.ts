import Fiber from './fibers'
import logger from '@wdio/logger'

const log = logger('@wdio/sync')

/**
 * Helper method to execute a row of hooks with certain parameters.
 * It will return with a reject promise due to a design decision to not let hooks/service intefer the
 * actual test process.
 *
 * @param  {Function|Function[]} hooks  list of hooks
 * @param  {object|object[]} args  list of parameter for hook functions
 * @return {Promise}  promise that gets resolved once all hooks finished running
 */
export default function executeHooksWithArgs<T> (hooks: Function | Function[] = [], args: object | object[] = {}): Promise<(T | Error)[]> {
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

    const hooksPromises = hooks.map((hook) => new Promise<T | Error>((resolve) => {
        let result

        const execHook = () => {
            delete global.browser._NOT_FIBER

            try {
                result = hook.apply(null, args)
            } catch (e) {
                log.error(e.stack)
                return resolve(e)
            }
            if (result && typeof result.then === 'function') {
                return result.then(resolve, (e: Error) => {
                    log.error(e.stack)
                    resolve(e)
                })
            }

            resolve(result)
        }

        /**
         * after command hooks require additional Fiber environment
         */
        return hook.constructor.name === 'AsyncFunction' ? execHook() : Fiber(execHook).run()
    }))

    return Promise.all(hooksPromises)
}
