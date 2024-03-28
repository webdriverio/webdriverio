/**
 * get HTML of selector element and peirce through all Shadow DOM documents
 *
 * @param  {string}  element               element to get HTML from
 * @param  {Boolean} includeSelectorTag    if true, selector tag gets included (uses outerHTML)
 * @param  {Object}  shadowElementIdsFound list of shadow root ids we want to look up in the next iteration
 * @return {Object}                        html source and list of shadow root ids found
 */
export default function getHTMLShadow (
    element: HTMLElement | ShadowRoot,
    includeSelectorTag: boolean,
    shadowElementIds: [string, HTMLElement][] = []
) {
    let styles: string[] = []
    const shadowElementIdsFound: string[] = []
    const elemsWithShadowRoot = Array.from(element.querySelectorAll('*'))
        .filter((el) => el.shadowRoot)

    /**
     * make sure to include the root itself
     */
    if ((element as HTMLElement).shadowRoot) {
        elemsWithShadowRoot.unshift(element as HTMLElement)
    }

    if (element.nodeType === 11) {
        styles = Array.from((element as ShadowRoot).adoptedStyleSheets)
            .map(({ cssRules }) => Array.from(cssRules))
            .flat()
            .map(({ cssText }) => cssText)
    }

    for (const elem of elemsWithShadowRoot) {
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
        /**
         * `getHTMLShadow` requires `includeSelectorTag` to be set to `false` if the element
         * is a shadow root itself
         */
        html: (element as HTMLElement)[includeSelectorTag ? 'outerHTML' : 'innerHTML'],
        shadowElementIdsFound,
        styles
    }
}
