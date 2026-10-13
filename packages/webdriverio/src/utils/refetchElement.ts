import implicitWait from './implicitWait.js'
import { REACT_OPTIONS, findElementAgain } from './findElementAgain.js'
import { describeSelector } from './describeSelector.js'
import type { ReactSelectorOptions } from '../types.js'

type Scope = WebdriverIO.Browser | WebdriverIO.Element

/**
 * The item of a list, found again in `parent` at its index without a wait, or a
 * "not found" item when the list is now shorter. Like `$()` finds a gone element
 * again as a "not found" element: check commands (`isDisplayed`,
 * `waitForDisplayed({ reverse: true })`) give their answer at once, and a command
 * that needs the element, or a parent of its element, waits for it in `implicitWait`
 * (#12576), which marks the error when the item does not come back.
 */
async function findItemAgain (item: WebdriverIO.Element, parent: Scope): Promise<WebdriverIO.Element> {
    const found = await findElementAgain(item, { parent })
    if (found) {
        return found
    }
    /**
     * imported here: `getElementObject` imports the utils barrel, see `implicitWait.ts`
     */
    const { getElements } = await import('./getElementObject.js')
    const error = new Error(`element with selector "${describeSelector(item)}" has no match at index ${item.index}`)
    const [notFound] = getElements.call(parent, item.selector, [error], {
        isReactElement: item.isReactElement,
        isShadowElement: item.isShadowElement,
        reactOptions: (item as WebdriverIO.Element & { [REACT_OPTIONS]?: ReactSelectorOptions })[REACT_OPTIONS]
    })
    notFound.index = item.index
    return notFound
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
     * Beginning with the browser object, re-chain. Each element is found again
     * with the command, index and strictness it was found with, in the parent
     * that was just found again. Falling back from a missing index to the first
     * `$` match would silently re-chain onto a different element.
     */
    return chain.reduce(async (elementPromise, element, currentIndex) => {
        const parent = await elementPromise
        /**
         * an element without an index is always found again, as a "not found" element when
         * it is gone, like `$()` gives one
         */
        const nextElement = element.index !== undefined
            ? await findItemAgain(element, parent)
            : await findElementAgain(element, { parent, wait: true }) as WebdriverIO.Element
        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        return await implicitWait(nextElement, currentIndex + 1 < length ? '$' : commandName)
    }, Promise.resolve(currentElement))
}
