
/**
 * get HTML of selector element
 *
 * @param  {string}  element             element to get HTML from
 * @param  {Boolean} includeSelectorTag  if true, selector tag gets included (uses outerHTML)
 * @param  {string[]} excludeElements    selectors to omit from the returned HTML
 * @return {String}                      html source
 */

export default function getHTML (element: HTMLElement, includeSelectorTag: boolean, excludeElements: string[] = []) {
    let target = element
    if (excludeElements?.length) {
        // Copy into an inert document so custom element constructors are not invoked.
        const document = element.ownerDocument.implementation.createHTMLDocument('')
        // Adopt without attaching to preserve the original document's noscript serialization.
        target = element.ownerDocument.adoptNode(document.importNode(element, true))
        for (const selector of excludeElements) {
            if (includeSelectorTag && target.matches(selector)) {
                return ''
            }
            target.querySelectorAll(selector).forEach((node) => node.remove())
        }
    }
    return target[includeSelectorTag ? 'outerHTML' : 'innerHTML']
}
