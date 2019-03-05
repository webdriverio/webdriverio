import logger from '@wdio/logger'
const log = logger('webdriverio')

export default async function implicitWait (currentElement, commandName) {

    if (!currentElement.elementId && !commandName.match(/(waitUntil|waitFor|isExisting|isDisplayed)/)) {
        log.debug(
            `command ${commandName} was called on an element ("${currentElement.selector}") ` +
            'that wasn\'t found, waiting for it...'
        )

        /**
         * create new promise so we can apply a custom error message in cases waitForExist fails
         */
        try {
            await currentElement.waitForExist()
            /**
             * if waitForExist was successful requery element and assign elementId to the scope
             */
            return await currentElement.parent.$(currentElement.selector)
        } catch {
            throw new Error(
                `Can't call ${commandName} on element with selector "${currentElement.selector}" because element wasn't found`)
        }
    }

    return currentElement
}
