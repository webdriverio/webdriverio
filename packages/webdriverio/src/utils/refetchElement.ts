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
        index: number
        strict?: boolean
    }[] = []

    /**
     * Crawl back to the browser object, and cache all selectors
     */
    while (currentElement.elementId && currentElement.parent) {
        selectors.push({
            selector: currentElement.selector,
            index: currentElement.index || 0,
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
        let nextElement = index > 0 ? await resolvedElement.$$(selector as string)[index]?.getElement() : null
        nextElement = nextElement || await resolvedElement.$(selector, { strict }).getElement()
        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        return await implicitWait(nextElement, currentIndex + 1 < length ? '$' : commandName)
    }, Promise.resolve(currentElement))
}
