import logger from '@wdio/logger'
import { getBrowserObject } from '@wdio/utils'

import { markWaited } from './elementNotFound.js'
import { hasCode, WAIT_UNTIL_TIMEOUT } from './errorCodes.js'

const log = logger('webdriverio')

/**
 * wait on element if:
 *  - elementId couldn't be fetched in the first place
 *  - command is not explicit wait command for existance or displayedness
 */
export default async function implicitWait (currentElement: WebdriverIO.Element, commandName: string): Promise<WebdriverIO.Element> {
    const browser = getBrowserObject(currentElement)
    const skipForMobileScroll = browser.isMobile && await browser.isNativeContext && (commandName === 'scrollIntoView' || commandName === 'tap')

    if (!currentElement.elementId && !/(waitUntil|waitFor|isExisting|is?\w+Displayed|is?\w+Clickable)/.test(commandName) && !skipForMobileScroll) {
        log.debug(
            `command ${commandName} was called on an element ("${currentElement.selector}") ` +
            'that wasn\'t found, waiting for it...'
        )

        try {
            await currentElement.waitForExist()
            /**
             * if waitForExist was successful requery element and assign elementId to the scope
             */
            return (currentElement.parent as WebdriverIO.Element).$(currentElement.selector).getElement()
        } catch (err) {
            const selector = currentElement.selector.toString()
            /**
             * an item of a list: the index tells which item was not found, other elements can
             * match the selector
             */
            const index = currentElement.index === undefined ? '' : ` at index ${currentElement.index}`
            let message = `Can't call ${commandName} on element with selector "${currentElement.selector}"${index} because element wasn't found`
            if (selector.includes('this.previousElementSibling')) {
                message = `Can't call ${commandName} on previous element of element with selector "${(currentElement.parent as WebdriverIO.Element).selector}" because sibling wasn't found`
            } else if (selector.includes('this.nextElementSibling')) {
                message = `Can't call ${commandName} on next element of element with selector "${(currentElement.parent as WebdriverIO.Element).selector}" because sibling wasn't found`
            } else if (selector.includes('this.parentElement')) {
                message = `Can't call ${commandName} on parent element of element with selector "${(currentElement.parent as WebdriverIO.Element).selector}" because it wasn't found`
            }
            const notFound = new Error(message)
            /**
             * the wait for the element timed out without it. A poll that threw (a closed window)
             * or a session that ended gets no flag
             */
            if (hasCode(err, WAIT_UNTIL_TIMEOUT)) {
                markWaited(notFound)
            }
            throw notFound
        }
    }

    return currentElement
}
