/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 */
export const elementErrorHandler = (fn) => (commandName, commandFn) => {
    return function (...args) {
        /**
         * handle stale element reference error
         */
        if (this.error && typeof this.error.message === 'string' && this.error.message.includes('stale')) {
            /**
             * ToDo
             */
        }

        if (!this.elementId) {
            /**
             * ToDo implement waitFor behavior
             */
            throw new Error(`Can't call ${commandName} on element with selector "${this.selector}" because element wasn't found`)
        }

        return fn(commandName, commandFn).apply(this, args)
    }
}
