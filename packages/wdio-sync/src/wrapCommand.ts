import { Future } from './fibers'
import logger from '@wdio/logger'

import executeHooksWithArgs from './executeHooksWithArgs'
import { sanitizeErrorMessage } from './utils'

const log = logger('@wdio/sync')

let inCommandHook = false
const timers: number[] = []
const elements = new Set()

/**
 * resets `_NOT_FIBER` if Timer has timed out
 */
process.on('WDIO_TIMER', (payload) => {
    if (payload.start) {
        return timers.push(payload.id)
    }
    if (timers.includes(payload.id)) {
        while (timers.pop() !== payload.id);
    }
    if (payload.timeout) {
        elements.forEach((element: any) => { delete element._NOT_FIBER })
    }
    if (timers.length === 0) {
        elements.clear()
    }
})

/**
 * wraps a function into a Fiber ready context to enable sync execution and hooks
 * @param  {Function}   fn             function to be executed
 * @param  {string}     commandName    name of that function
 * @return {Function}   actual wrapped function
 */
export default function wrapCommand(commandName: string, fn: Function): Function {
    return function wrapCommandFn(this: WebdriverIO.Client, ...args: unknown[]) {
        /**
         * print error if a user is using a fiberized command outside of the Fibers context
         */
        if (!global._HAS_FIBER_CONTEXT && global.WDIO_WORKER) {
            log.warn(
                `Can't return command result of ${commandName} synchronously because command ` +
                'was executed outside of an it block, hook or step definition!'
            )
        }

        /**
         * store element if Timer is running to reset `_NOT_FIBER` if timeout has occurred
         */
        if (timers.length > 0) {
            elements.add(this)
        }

        /**
         * Avoid running some functions in Future that are not in Fiber.
         */
        if (this._NOT_FIBER === true) {
            this._NOT_FIBER = isNotInFiber(this, fn.name)
            return fn.apply(this, args)
        }
        /**
         * all named nested functions run in parent Fiber context
         */
        this._NOT_FIBER = fn.name !== ''

        const future = new Future()

        const result = runCommandWithHooks.apply(this, [commandName, fn, ...args])
        result.then(future.return.bind(future), future.throw.bind(future))

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
async function runCommandWithHooks(this: WebdriverIO.BrowserObject, commandName: string, fn: Function, ...args: unknown[]) {
    // save error for getting full stack in case of failure
    // should be before any async calls
    const stackError = new Error()

    await runCommandHook.call(this, this.options.beforeCommand, [commandName, args])

    let commandResult
    let commandError
    try {
        commandResult = await fn.apply(this, args)
    } catch (err) {
        commandError = sanitizeErrorMessage(err, stackError)
    }

    await runCommandHook.call(this, this.options.afterCommand, [commandName, args, commandResult, commandError])

    if (commandError) {
        throw commandError
    }

    return commandResult
}

async function runCommandHook(hookFn: Function | Function[], args: object | object[]) {
    if (!inCommandHook) {
        inCommandHook = true
        await executeHooksWithArgs(hookFn, args)
        inCommandHook = false
    }
}

/**
 * isNotInFiber
 * if element or its parent has element id then we are in parent's Fiber
 * @param {object} context browser or element
 * @param {string} fnName function name
 */
function isNotInFiber(context: WebdriverIO.BrowserObject, fnName: string) {
    return fnName !== '' && !!(context.elementId || (context.parent && context.parent.elementId))
}

/**
 * set `_NOT_FIBER` to `false` for element and its parents
 * @param {object} context browser or element
 */
function inFiber(context: WebdriverIO.BrowserObject) {
    if (context.constructor.name === 'MultiRemoteDriver') {
        return context.instances.forEach((instance: WebdriverIO.BrowserObject) => {
            context[instance]._NOT_FIBER = false
            let parent = context[instance].parent
            while (parent && parent._NOT_FIBER) {
                parent._NOT_FIBER = false
                parent = parent.parent
            }
        })
    }

    context._NOT_FIBER = false
    let parent = context.parent
    while (parent && parent._NOT_FIBER) {
        parent._NOT_FIBER = false
        parent = parent.parent
    }
}
