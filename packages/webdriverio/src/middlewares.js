import logger from 'wdio-logger'

const log = logger('webdriverio')

/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 *
 * @param  {Function} fn  commandWrap from wdio-sync package (or shim if not running in sync)
 */

/**
 * [elementErrorHandler description]

 * @return {[type]}      [description]
 */
export const elementErrorHandler = (fn) => (commandName, commandFn) => {
    return function (...args) {
        /**
         * wait on element if:
         *  - elementId couldn't be fetched in the first place
         *  - command is not explicit wait command for existance or displayedness
         */
        if (!this.elementId && !commandName.match(/(wait(Until|ForDisplayed|ForExist|ForEnabled)|isExisting)/)) {
            log.debug(
                `command ${commandName} was called on an element ("${this.selector}") ` +
                `that wasn't found, waiting for it...`
            )

            return fn(commandName, () => {
                /**
                 * create new promise so we can apply a custom error message in cases waitForExist fails
                 */
                return new Promise((resolve, reject) => this.waitForExist().then(resolve, reject)).then(
                    /**
                     * if waitForExist was successful requery element and assign elementId to the scope
                     */
                    () => {
                        return this.parent.$(this.selector).then((elem) => {
                            this.elementId = elem.elementId
                            return fn(commandName, commandFn).apply(this, args)
                        })
                    },
                    /**
                     * if waitForExist failes throw custom error
                     */
                    () => {
                        throw new Error(`Can't call ${commandName} on element with selector "${this.selector}" because element wasn't found`)
                    }
                )
            }).apply(this)
        }

        return fn(commandName, commandFn).apply(this, args)
    }
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
