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
        const future = new Future()

        const result = runCommandWithHooks.apply(this, [commandName, fn, ...args])
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

/**
 * helper method that runs the command with before/afterCommand hook
 */
async function runCommandWithHooks (commandName, fn, ...args) {
    const shouldRunHook = !shouldSkipHook(fn)

    if (shouldRunHook) {
        await runBeforeCommand.apply(this, [commandName, ...args])
    }

    let commandResult
    let commandError
    try {
        commandResult = await runCommand.apply(this, [fn, ...args])
    } catch (err) {
        commandError = err
    }

    if (shouldRunHook) {
        await runAfterCommand.apply(this, [commandName, commandResult, commandError, ...args])
    }

    if (commandError) {
        throw commandError
    }

    return commandResult
}

async function runCommand (fn, ...args) {
    // save error for getting full stack in case of failure
    // should be before any async calls
    const stackError = new Error()
    try {
        return await fn.apply(this, args)
    } catch (err) {
        throw sanitizeErrorMessage(err, stackError)
    }
}

function runBeforeCommand (commandName, ...args) {
    return executeHooksWithArgs(this.options.beforeCommand, [commandName, args])
}

function runAfterCommand (commandName, commandResult, commandError, ...args) {
    return executeHooksWithArgs(this.options.afterCommand, [commandName, args, commandResult, commandError])
}

function shouldSkipHook(fn) {
    const ignoredFunctions = ['elementErrorHandlerFn', 'wrapCommandFn', 'elementErrorHandlerCallbackFn']
    return fn.SKIP_COMMAND_HOOK === true || ignoredFunctions.some(fnName => fnName === fn.name)
}
