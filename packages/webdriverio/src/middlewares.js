import refetchElement from './utils/refetchElement'
import implicitWait from './utils/implicitWait'

/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 *
 * @param  {Function} fn  commandWrap from wdio-sync package (or shim if not running in sync)
 */
export const elementErrorHandler = (fn) => (commandName, commandFn) => {
    return fn(commandName, async function elementErrorHandlerCallback (...args) {
        // const result = async function elementErrorHandlerCallbackFn () {
        const element = await implicitWait(this, commandName)
        this.elementId = element.elementId

        try {
            // console.log('--> RUN', commandName, args)
            const result = await commandFn.apply(this, args)

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

                return commandFn.apply(this, args)
            }
            throw error
        }
        // })

        // if (typeof result === 'function' && result.name === 'callFn') {
        //     return result.call(this, ...args)
        // }
        //
        // return result
    })
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
