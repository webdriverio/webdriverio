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
    return function wrapCommandFn (...args) {
        // save error for getting full stack in case of failure
        // should be before any async calls
        const stackError = new Error()
        /**
         * Avoid running some functions in Future that are not in Fiber.
         */
        if (this._NOT_FIBER === true) {
            this._NOT_FIBER = isNotInFiber(this, fn.name)
            return runCommand.apply(this, [fn, stackError, ...args])
        }
        /**
         * all named nested functions run in parent Fiber context
         * except of debug and waitUntil
         */
        this._NOT_FIBER = fn.name !== '' && fn.name !== 'debug' && commandName !== 'waitUntil'

        const future = new Future()

        const result = runCommandWithHooks.apply(this, [commandName, fn, stackError, ...args])
        result.then(::future.return, ::future.throw)

        try {
            const futureResult = future.wait()
            inFiber(this)
            return futureResult
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

            inFiber(this)
            throw e
        }
    }
}

/**
 * helper method that runs the command with before/afterCommand hook
 */
async function runCommandWithHooks (commandName, fn, stackError, ...args) {
    await executeHooksWithArgs(
        this.options.beforeCommand,
        [commandName, args]
    )

    let commandResult
    let commandError
    try {
        commandResult = await runCommand.apply(this, [fn, stackError, ...args])
    } catch (err) {
        commandError = err
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

async function runCommand (fn, stackError, ...args) {
    try {
        return await fn.apply(this, args)
    } catch (err) {
        throw sanitizeErrorMessage(err, stackError)
    }
}

/**
 * isNotInFiber
 * if element or its parent has element id then we are in parent's Fiber
 * @param {object} context browser or element
 * @param {string} fnName function name
 */
function isNotInFiber (context, fnName) {
    return fnName !== '' && !!(context.elementId || (context.parent && context.parent.elementId))
}

/**
 * set `_NOT_FIBER` to `false` for element and its parents
 * @param {object} context browser or element
 */
function inFiber(context) {
    context._NOT_FIBER = false
    let parent = context.parent
    while (parent && parent._NOT_FIBER) {
        parent._NOT_FIBER = false
        parent = parent.parent
    }
}
