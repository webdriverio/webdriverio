import implicitWait from './implicitWait'

/**
 * helper utility to refetch an element and all its parent elements when running
 * into stale element exception errors
 * @param  {Object}  currentElement  element to refetch
 * @param  {string}  commandName  name of the command that called this
 * @return {Promise} resolves with element after all its parent were refetched
 */
export default async function refetchElement (currentElement, commandName) {
    let selectors = []

    //Crawl back to the browser object, and cache all selectors
    while(currentElement.elementId && currentElement.parent) {
        selectors.push(currentElement.selector)
        currentElement = currentElement.parent
    }
    selectors.reverse()

    const length = selectors.length

    // Beginning with the browser object, rechain
    return selectors.reduce(async (elementPromise, selector, index) => {
        const resolvedElement = await elementPromise
        let nextElement = await resolvedElement.$(selector)
        /**
         *  For error purposes, changing command name to '$' if we aren't
         *  on the last element of the array
         */
        return await implicitWait(nextElement, index + 1 < length ? '$' : commandName)
    }, Promise.resolve(currentElement))
}
