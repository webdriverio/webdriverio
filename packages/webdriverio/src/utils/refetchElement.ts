import implicitWait from './implicitWait.js'
import { getElement } from './getElementObject.js'
import type { Selector } from '../types.js'

/**
 * helper utility to refetch an element and all its parent elements when running
 * into stale element exception errors
 */
export default async function refetchElement (
    currentElement: WebdriverIO.Element,
    commandName: string
): Promise<WebdriverIO.Element> {
    const selectors: {
        selector: Selector
        index: number
    }[] = []

    /**
     * Crawl back to the browser object, and cache all selectors
     */
    while (currentElement.elementId && currentElement.parent) {
        selectors.push({ selector: currentElement.selector, index: currentElement.index || 0 })
        currentElement = currentElement.parent as WebdriverIO.Element
    }
    selectors.reverse()

    const length = selectors.length

    /**
     * Beginning with the browser object, re-chain
     */
    let resolvedElement = currentElement
    for (const [currentIndex, { selector, index }] of selectors.entries()) {
        let nextElement: WebdriverIO.Element
        if (index > 0) {
            const elements = await resolvedElement.$$(selector as string).getElements()

            /**
             * if the list shrunk below the index we are looking for, the element is gone,
             * so return a missing element rather than falling back to the first match
             */
            if (!elements[index]) {
                const missingElement = getElement.call(
                    resolvedElement,
                    selector,
                    new Error(`Index out of bounds! $$(${selector}) returned only ${elements.length} elements.`)
                )
                missingElement.index = index
                return missingElement
            }

            nextElement = elements[index]
        } else {
            nextElement = await resolvedElement.$(selector).getElement()
        }

        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        resolvedElement = await implicitWait(nextElement, currentIndex + 1 < length ? '$' : commandName)
    }

    return resolvedElement
}
