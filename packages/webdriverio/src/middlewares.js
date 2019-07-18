
import refetchElement from './utils/refetchElement'
import implicitWait from './utils/implicitWait'

/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 *
 * @param  {Function} fn  commandWrap from wdio-sync package (or shim if not running in sync)
 */
export const elementErrorHandler = (fn) => (commandName, commandFn) => {
    function elementErrorHandlerFn (...args) {
        elementErrorHandlerFn.CALLS_COUNTER++

        const elementErrorHandlerCallbackFn = async () => {
            commandFn.IS_ERROR_HANDLER = true
            const element = await implicitWait(this, commandName)
            this.elementId = element.elementId

            try {
                const result = await fn(commandName, commandFn).apply(this, args)

                /**
                 * assume Safari responses like { error: 'no such element', message: '', stacktrace: '' }
                 * as `stale element reference`
                 */
                if (result && result.error === 'no such element') {
                    const err = new Error()
                    err.name = 'stale element reference'
                    throw err
                }

                return result
            } catch (error) {
                if (error.name === 'stale element reference') {
                    const element = await refetchElement(this, commandName)
                    this.elementId = element.elementId
                    this.parent = element.parent

                    return await fn(commandName, commandFn).apply(this, args)
                }
                throw error
            }
        }

        /**
         * Avoid calling before/after command hook if function marked accordingly
         * or function call counter reached (wrapped function calling another wrapped function that causes same hook to be called multiple times)
         */
        if (commandFn.SKIP_COMMAND_HOOK || commandFn.IS_ERROR_HANDLER || elementErrorHandlerFn.CALLS_COUNTER > 2) {
            elementErrorHandlerCallbackFn.SKIP_COMMAND_HOOK = true
            elementErrorHandlerFn.SKIP_COMMAND_HOOK = true
        }

        return fn(commandName, elementErrorHandlerCallbackFn).apply(this)

    }

    elementErrorHandlerFn.CALLS_COUNTER = 0
    return elementErrorHandlerFn
}

/**
 * handle single command calls from multiremote instances
 */
export const multiremoteHandler = (wrapCommand) => (commandName) => {
    return wrapCommand(commandName, function (...args) {
        const commandResults = this.instances.map((instanceName) => {
            return this[instanceName][commandName](...args)
        })

        return Promise.all(commandResults)
    })
}
