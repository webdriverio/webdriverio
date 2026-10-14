import logger from '@wdio/logger'
import { getBrowserObject } from '@wdio/utils'

/**
 * imported from the leaf module directly (not `./strictMode.js`) - that module
 * pulls in the whole `utils/index.ts` barrel, which transitively closes a
 * circular import back onto this file via `middlewares.js` -> `refetchElement.js`
 */
import { StrictSelectorError } from './strictSelectorError.js'
import { INDEX_NOT_FOUND, findElementAgain } from './findElementAgain.js'
import { describeSelector } from './describeSelector.js'
import { markWaited } from './elementNotFound.js'

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
        /**
         * `$$(selector)[index]` already waited `waitforTimeout` for the index, see
         * `elementAt` in `element/array.ts`: look for the item once more, without a second
         * wait, as `isExisting()` does. The list can reach the index after that wait. If it
         * still does not, throw the "Index out of bounds" error of the wait
         */
        if ((currentElement as WebdriverIO.Element & { [INDEX_NOT_FOUND]?: boolean })[INDEX_NOT_FOUND]) {
            const item = await findElementAgain(currentElement)
            if (!item?.elementId) {
                throw currentElement.error
            }
            delete currentElement.error
            return item
        }

        log.debug(
            `command ${commandName} was called on an element ("${describeSelector(currentElement)}") ` +
            'that wasn\'t found, waiting for it...'
        )

        let existed = false
        try {
            await currentElement.waitForExist()
            existed = true
            /**
             * if waitForExist was successful requery element and assign elementId to the scope,
             * with the command, index and strictness it was originally queried with. Falling
             * back from a missing index to the first `$` match would silently hand back a
             * different element.
             *
             * This is awaited explicitly (rather than returned directly) so a
             * `StrictSelectorError` raised by the re-fetch itself is routed through the
             * `catch` below instead of bypassing it.
             */
            const nextElement = await findElementAgain(currentElement, { wait: true })

            if (!nextElement) {
                throw new Error(
                    `element with selector "${describeSelector(currentElement)}" has no match at index ${currentElement.index}`)
            }

            return nextElement
        } catch (err) {
            /**
             * a strict-mode violation that surfaced while waiting is a real
             * error the user needs to see - don't mask it as "element wasn't found"
             */
            if (err instanceof StrictSelectorError) {
                throw err
            }

            const selector = currentElement.selector.toString()
            /**
             * an item of a list: the index tells which item was not found, other elements can
             * match the selector
             */
            const index = currentElement.index === undefined ? '' : ` at index ${currentElement.index}`
            let message = `Can't call ${commandName} on element with selector "${describeSelector(currentElement)}"${index} because element wasn't found`
            if (selector.includes('this.previousElementSibling')) {
                message = `Can't call ${commandName} on previous element of element with selector "${describeSelector(currentElement.parent as WebdriverIO.Element)}" because sibling wasn't found`
            } else if (selector.includes('this.nextElementSibling')) {
                message = `Can't call ${commandName} on next element of element with selector "${describeSelector(currentElement.parent as WebdriverIO.Element)}" because sibling wasn't found`
            } else if (selector.includes('this.parentElement')) {
                message = `Can't call ${commandName} on parent element of element with selector "${describeSelector(currentElement.parent as WebdriverIO.Element)}" because it wasn't found`
            }
            const notFound = new Error(message)
            /**
             * the wait for the element ended without it. A lookup that failed after the
             * element existed gets no flag: the element can be found again
             */
            if (!existed) {
                markWaited(notFound)
            }
            throw notFound
        }
    }

    return currentElement
}
