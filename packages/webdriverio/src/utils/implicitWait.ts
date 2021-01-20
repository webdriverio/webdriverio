import logger from '@wdio/logger'

const log = logger('webdriverio')

/**
 * wait on element if:
 *  - elementId couldn't be fetched in the first place
 *  - command is not explicit wait command for existance or displayedness
 */
export default async function implicitWait (currentElement: WebdriverIO.Element, commandName: string): Promise<WebdriverIO.Element> {
    if (!currentElement.elementId && !commandName.match(/(waitUntil|waitFor|isExisting|is?\w+Displayed|is?\w+Clickable)/)) {
        log.debug(
            `command ${commandName} was called on an element ("${currentElement.selector}") ` +
            'that wasn\'t found, waiting for it...'
        )

        try {
            await currentElement.waitForExist()
            /**
             * if waitForExist was successful requery element and assign elementId to the scope
             */
            return (currentElement.parent as WebdriverIO.Element).$(currentElement.selector)
        } catch {
            if (currentElement.selector.toString().includes('this.previousElementSibling')) {
                throw new Error(
                    `Can't call ${commandName} on previous element of element with selector "${(currentElement.parent as WebdriverIO.Element).selector}" because sibling wasn't found`)
            }

            if (currentElement.selector.toString().includes('this.nextElementSibling')) {
                throw new Error(
                    `Can't call ${commandName} on next element of element with selector "${(currentElement.parent as WebdriverIO.Element).selector}" because sibling wasn't found`)
            }

            if (currentElement.selector.toString().includes('this.parentElement')) {
                throw new Error(
                    `Can't call ${commandName} on parent element of element with selector "${(currentElement.parent as WebdriverIO.Element).selector}" because it wasn't found`)
            }

            throw new Error(
                `Can't call ${commandName} on element with selector "${currentElement.selector}" because element wasn't found`)
        }
    }

    return currentElement
}
