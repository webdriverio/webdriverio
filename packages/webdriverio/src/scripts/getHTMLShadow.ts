/**
 * get HTML of selector element
 *
 * @param  {string}  element             element to get HTML from
 * @param  {Boolean} includeSelectorTag  if true, selector tag gets included (uses outerHTML)
 * @return {String}                      html source
 */
export default function getHTMLShadow (
    element: HTMLElement,
    includeSelectorTag: boolean,
    shadowElementIds: [string, HTMLElement][] = []
) {
    const shadowElementIdsFound: string[] = []
    const elemsWithShadowRoot = Array.from(element.querySelectorAll('*'))
        .filter((el) => el.shadowRoot)
    for (const elem of elemsWithShadowRoot) {
        if (elem.hasAttribute('data-wdio-shadow-id')) {
            continue
        }

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
