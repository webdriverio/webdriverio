import Future from 'fibers/future'

import executeHooksWithArgs from './executeHooksWithArgs'
import { sanitizeErrorMessage } from './utils'

/**
 * wraps a function into a Fiber ready context to enable sync execution and hooks
 * @param  {Function}   fn             function to be executed
 * @param  {String}     commandName    name of that function
 * @param  {Function[]} beforeCommand  method to be executed before calling the actual function
 * @param  {Function[]} afterCommand   method to be executed after calling the actual function
 * @return {Function}   actual wrapped function
 */
export default function wrapCommand (commandName, fn) {
    /**
     * helper method that runs the command with before/afterCommand hook
     */
    const runCommand = async function (...args) {
        // save error for getting full stack in case of failure
        // should be before any async calls
        const stackError = new Error()

        await executeHooksWithArgs(
            this.options.beforeCommand,
            [commandName, args]
        )

        let commandResult
        let commandError
        try {
            commandResult = await fn.apply(this, args)
        } catch (err) {
            commandError = sanitizeErrorMessage(err, stackError)
        }

        await executeHooksWithArgs(
            this.options.afterCommand,
            [commandName, args, commandResult, commandError]
        )

        if (commandError) {
            throw commandError
        }

        return commandResult
    }

    return function (...args) {
        const future = new Future()

        const result = runCommand.apply(this, args)
        result.then(::future.return, ::future.throw)

        try {
            return future.wait()
        } catch (e) {
            /**
             * in case some 3rd party lib rejects without bundling into an error
             */
            if (typeof e === 'string') {
                throw new Error(e)
            }

            /**
             * in case we run commands where no fiber function was used
             * e.g. when we call deleteSession
             */
            if (e.message.includes('Can\'t wait without a fiber')) {
                return result
            }

            throw e
        }
    }
}
