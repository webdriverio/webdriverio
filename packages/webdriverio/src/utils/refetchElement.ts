import implicitWait from './implicitWait.js'
import { findElementAgain } from './findElementAgain.js'

/**
 * helper utility to refetch an element and all its parent elements when running
 * into stale element exception errors
 */
export default async function refetchElement (
    currentElement: WebdriverIO.Element,
    commandName: string
): Promise<WebdriverIO.Element> {
    const chain: WebdriverIO.Element[] = []

    /**
     * Crawl back to the browser object, and cache all elements of the chain
     */
    while (currentElement.elementId && currentElement.parent) {
        chain.push(currentElement)
        currentElement = currentElement.parent as WebdriverIO.Element
    }
    chain.reverse()

    const length = chain.length

    /**
     * Beginning with the browser object, re-chain. Each element is found again
     * with the command, index and strictness it was found with, in the parent
     * that was just found again. Falling back from a missing index to the first
     * `$` match would silently re-chain onto a different element.
     */
    return chain.reduce(async (elementPromise, element, currentIndex) => {
        const parent = await elementPromise
        const nextElement = await findElementAgain(element, { parent, wait: true })

        if (!nextElement) {
            throw new Error(`element with selector "${element.selector}" has no match at index ${element.index}`)
        }
        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        return await implicitWait(nextElement, currentIndex + 1 < length ? '$' : commandName)
    }, Promise.resolve(currentElement))
}
