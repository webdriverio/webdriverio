/**
 * Check DOM containment (crossing shadow boundaries via `.host`, like `elementContains.ts`)
 * for many candidate elements in a single round trip instead of one `execute()` call per
 * candidate. Kept as a separate self-contained function (rather than sharing a helper with
 * `elementContains.ts`) because `browser.execute()` serializes only the passed function's
 * own source text — it cannot reference helpers defined outside of it.
 */
export default function elementsContainedIn (
    scope: HTMLElement,
    elements: HTMLElement[]
): boolean[] {
    function isInDocument (element: HTMLElement) {
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

    return elements.map((element) => isInDocument(element))
}
