import logger from '@wdio/logger'
import { getBrowserObject } from '@wdio/utils'

import { StrictSelectorError } from './strictMode.js'

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
             * Re-fetch with the same strictness the element was originally queried with,
             * otherwise an opted-out `$(sel, { strict: false })` or an element coming from
             * `$$` would suddenly throw here.
             */
            return (currentElement.parent as WebdriverIO.Element)
                .$(currentElement.selector, { strict: currentElement.strict })
                .getElement()
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
