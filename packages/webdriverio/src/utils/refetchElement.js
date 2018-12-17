export default async function refetchElement (currentElement) {
    let selectors = [];

    //Crawl back to the browser object, and cache all selectors
    while(currentElement.elementId && currentElement.parent) {
        selectors.push(currentElement.selector);
        currentElement = currentElement.parent;
    }
    selectors.reverse();

    // Beginning with the browser object, rechain
    return selectors.reduce(async (elementPromise, selector) => {
        const resolvedElement = await elementPromise;
        return resolvedElement.$(selector);
    }, Promise.resolve(currentElement));
}
