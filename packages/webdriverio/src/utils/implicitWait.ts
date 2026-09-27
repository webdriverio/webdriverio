import logger from '@wdio/logger'
import { getBrowserObject } from '@wdio/utils'

/**
 * imported from the leaf module directly (not `./strictMode.js`) - that module
 * pulls in the whole `utils/index.ts` barrel, which transitively closes a
 * circular import back onto this file via `middlewares.js` -> `refetchElement.js`
 */
import { StrictSelectorError } from './strictSelectorError.js'

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
             * if waitForExist was successful requery element and assign elementId to the scope.
             * An element coming from `$$` (has an index) is re-fetched through `$$` at the
             * same index, everything else through `$` with the same strictness it was
             * originally queried with, so an opted-out `$(sel, { strict: false })` doesn't
             * suddenly throw here. The two paths stay separate on purpose: falling back
             * from a missing index to the first `$` match would silently hand back a
             * different element.
             *
             * This is awaited explicitly (rather than returned directly) so a
             * `StrictSelectorError` raised by the re-fetch itself is routed through the
             * `catch` below instead of bypassing it.
             */
            const parent = currentElement.parent as WebdriverIO.Element
            const nextElement = currentElement.index !== undefined
                ? await parent.$$(currentElement.selector as string)[currentElement.index]?.getElement()
                : await parent.$(currentElement.selector, { strict: currentElement.strict }).getElement()

            if (!nextElement) {
                throw new Error(
                    `element with selector "${currentElement.selector}" has no match at index ${currentElement.index}`)
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
