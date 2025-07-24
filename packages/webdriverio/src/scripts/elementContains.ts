export default function elementContains (
    scope: HTMLElement,
    element: HTMLElement
) {
    function isInDocument(element: HTMLElement) {
        let currentElement: HTMLElement | ParentNode = element
        while (currentElement && currentElement.parentNode) {
            if (currentElement.parentNode === scope || (currentElement.parentNode as ShadowRoot).host === scope) {
                return true
            } else if (currentElement.parentNode instanceof DocumentFragment) {
                currentElement = (currentElement.parentNode as ShadowRoot).host
            } else {
                currentElement = currentElement.parentNode
            }
        }
        return false
    }

    return isInDocument(element)
}
