/**
 * helper utility to refetch an element and all its parent elements when running
 * into stale element exception errors
 * @param  {Object}  currentElement  element to refetch
 * @return {Promise}                 resolves with element after all its parent were refetched
 */
export default async function refetchElement (currentElement) {
    let selectors = []

    //Crawl back to the browser object, and cache all selectors
    while(currentElement.elementId && currentElement.parent) {
        selectors.push(currentElement.selector)
        currentElement = currentElement.parent
    }
    selectors.reverse()

    // Beginning with the browser object, rechain
    return selectors.reduce(async (elementPromise, selector) => {
        const resolvedElement = await elementPromise
        let nextElement = await resolvedElement.$(selector)
        //If the element wasn't found, we should wait for it
        if (!nextElement.elementId) {
            await nextElement.waitForExist()
            nextElement = await resolvedElement.$(selector)
        }
        return nextElement
    }, Promise.resolve(currentElement))
}
