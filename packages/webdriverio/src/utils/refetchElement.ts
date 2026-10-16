import implicitWait from './implicitWait.js'
import { notFoundElement, recordNotFound, waitedFor } from './elementNotFound.js'
import { hasCode, WAIT_UNTIL_TIMEOUT } from './errorCodes.js'

/**
 * Find an item of a `$$()` list again by its index. `$$()[index]` waits `waitforTimeout` for
 * the list to reach the index: when it does not, the error says which item was not found (other
 * elements can match the selector), and records it, see `nameNotFoundAgain`.
 */
async function findItemAgain (
    item: WebdriverIO.Element,
    parent: WebdriverIO.Browser | WebdriverIO.Element,
    commandName: string
): Promise<WebdriverIO.Element> {
    try {
        return await parent.$$(item.selector as string)[item.index as number].getElement()
    } catch (err) {
        if (hasCode(err, WAIT_UNTIL_TIMEOUT)) {
            const notFound = new Error(
                `Can't call ${commandName} on element with selector "${item.selector}" at index ${item.index} because element wasn't found`)
            recordNotFound(notFound, item)
            throw notFound
        }
        throw err
    }
}

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
     * Beginning with the browser object, re-chain
     */
    return chain.reduce(async (elementPromise, element, currentIndex) => {
        const parent = await elementPromise
        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        const name = currentIndex + 1 < length ? '$' : commandName
        let nextElement: WebdriverIO.Element
        try {
            nextElement = element.index !== undefined
                ? await findItemAgain(element, parent, name)
                : await parent.$(element.selector).getElement()
        } catch (err) {
            /**
             * the lookup in a parent without an element id waited for that parent and did not
             * find it (for example after `isDisplayed()` of a removed parent)
             */
            if (waitedFor(err) && notFoundElement(err) === undefined) {
                recordNotFound(err, parent)
            }
            throw err
        }
        try {
            return await implicitWait(nextElement, name)
        } catch (err) {
            /**
             * the element of the chain that was not found, see `nameNotFoundAgain`
             */
            if (waitedFor(err)) {
                recordNotFound(err, element)
            }
            throw err
        }
    }, Promise.resolve(currentElement))
}
