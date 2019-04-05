import logger from '@wdio/logger'
const log = logger('webdriverio')

/**
 * wait on element if:
 *  - elementId couldn't be fetched in the first place
 *  - command is not explicit wait command for existance or displayedness
 * @param  {Object}  currentElement  element to wait on if necessary
 * @param  {string}  commandName  name of the command that called this
 * @return {Promise} resolves with element after any necessary waiting
 */
export default async function implicitWait (currentElement, commandName) {

    if (!currentElement.elementId && !commandName.match(/(waitUntil|waitFor|isExisting|is?\w+Displayed)/)) {
        log.debug(
            `command ${commandName} was called on an element ("${currentElement.selector}") ` +
            'that wasn\'t found, waiting for it...'
        )

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
