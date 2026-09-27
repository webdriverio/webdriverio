import implicitWait from './implicitWait.js'
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
        index?: number
        strict?: boolean
    }[] = []

    /**
     * Crawl back to the browser object, and cache all selectors
     */
    while (currentElement.elementId && currentElement.parent) {
        selectors.push({
            selector: currentElement.selector,
            index: currentElement.index,
            strict: currentElement.strict
        })
        currentElement = currentElement.parent as WebdriverIO.Element
    }
    selectors.reverse()

    const length = selectors.length

    /**
     * Beginning with the browser object, re-chain
     */
    return selectors.reduce(async (elementPromise, { selector, index, strict }, currentIndex) => {
        const resolvedElement = await elementPromise
        /**
         * an element that came from `$$` is re-fetched at its own index, everything
         * else through `$`. Falling back from a missing index to the first `$` match
         * would silently re-chain onto a different element.
         */
        const nextElement = index !== undefined
            ? await resolvedElement.$$(selector as string)[index]?.getElement()
            : await resolvedElement.$(selector, { strict }).getElement()

        if (!nextElement) {
            throw new Error(`element with selector "${selector}" has no match at index ${index}`)
        }
        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        return await implicitWait(nextElement, currentIndex + 1 < length ? '$' : commandName)
    }, Promise.resolve(currentElement))
}
