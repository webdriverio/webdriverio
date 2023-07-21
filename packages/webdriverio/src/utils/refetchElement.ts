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
    }[] = []

    //Crawl back to the browser object, and cache all selectors
    while (currentElement.elementId && currentElement.parent) {
        selectors.push({ selector: currentElement.selector, index: currentElement.index || 0 })
        currentElement = currentElement.parent as WebdriverIO.Element
    }
    selectors.reverse()

    const length = selectors.length

    // Beginning with the browser object, rechain
    return selectors.reduce(async (elementPromise, { selector, index }, currentIndex) => {
        const resolvedElement = await elementPromise
        let nextElement = index > 0 ? (await resolvedElement.$$(selector as string))[index] : null
        nextElement = nextElement || await resolvedElement.$(selector)
        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        return await implicitWait(nextElement, currentIndex + 1 < length ? '$' : commandName)
    }, Promise.resolve(currentElement))
}
