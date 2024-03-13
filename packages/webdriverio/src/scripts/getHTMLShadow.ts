/**
 * get HTML of selector element and peirce through all Shadow DOM documents
 *
 * @param  {string}  element               element to get HTML from
 * @param  {Boolean} includeSelectorTag    if true, selector tag gets included (uses outerHTML)
 * @param  {Object}  shadowElementIdsFound list of shadow root ids we want to look up in the next iteration
 * @return {Object}                        html source and list of shadow root ids found
 */
export default function getHTMLShadow (
    element: HTMLElement,
    includeSelectorTag: boolean,
    shadowElementIds: [string, HTMLElement][] = []
) {
    const shadowElementIdsFound: string[] = []
    const elemsWithShadowRoot = Array.from(element.querySelectorAll('*'))
        .filter((el) => el.shadowRoot)

    /**
     * make sure to include the root itself
     */
    if (element.shadowRoot) {
        elemsWithShadowRoot.unshift(element)
    }

    for (const elem of elemsWithShadowRoot) {
        if (elem.hasAttribute('data-wdio-shadow-id')) {
            continue
        }

        /**
         * attach `data-wdio-shadow-id` attribute to the element so we can later
         * identify it and pierce into its shadow root
         */
        const shadowElement = shadowElementIds.find(([, sel]) => elem === sel)
        if (shadowElement) {
            shadowElementIdsFound.push(shadowElement[0])
            elem.setAttribute('data-wdio-shadow-id', shadowElement[0])
        }
    }

    return {
        html: element[includeSelectorTag ? 'outerHTML' : 'innerHTML'],
        shadowElementIdsFound
    }
}
