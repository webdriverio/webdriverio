/**
 * get HTML of all shadow roots
 *
 * @param  {string}  element               element to get HTML from
 * @param  {Boolean} includeSelectorTag    if true, selector tag gets included (uses outerHTML)
 * @param  {Object}  shadowElementIdsFound list of shadow root ids we want to look up in the next iteration
 * @return {Object}                        html source and list of shadow root ids found
 */
export default function getHTMLShadow (
    element: HTMLElement | ShadowRoot,
    includeSelectorTag: boolean,
    shadowElementIds: [string, HTMLElement, HTMLElement | undefined][] = []
) {
    shadowElementIds.map(([id, elem]) => {
        /**
         * if we don't have a shadow root (e.g. most likely to be the root document node)
         */
        if (typeof elem.setAttribute !== 'function') {
            return
        }

        elem.setAttribute('data-wdio-shadow-id', id)
    })

    const shadowElementHTML = shadowElementIds.map(([id, elem, shadow]) => {
        /**
         * if we don't have a shadow root (e.g. most likely to be the root document node)
         * we just get the html of the element
         */
        if (!shadow) {
            const html = elem[includeSelectorTag ? 'outerHTML' : 'innerHTML']
            return { id, html }
        }

        /**
         * otherwise, we look up the registered shadow styles and html
         */
        const styles = Array.from((shadow as unknown as ShadowRoot).adoptedStyleSheets || [])
            .map(({ cssRules }) => Array.from(cssRules))
            .flat()
            .map(({ cssText }) => cssText)

        const html = shadow.innerHTML
        return { id, html, styles }
    })

    return {
        html: (element as HTMLElement)[includeSelectorTag ? 'outerHTML' : 'innerHTML'],
        shadowElementHTML
    }
}
