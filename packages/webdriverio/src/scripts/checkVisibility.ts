/**
 * checks if an element is visible with `Element.checkVisibility`
 * @param  {HTMLElement} elem    element to check
 * @param  {object}      params  the options of `Element.checkVisibility`
 * @return {Boolean|null}        the visibility, or `null` when the browser has no `checkVisibility`
 */
export default function checkVisibility (elem: HTMLElement, params: CheckVisibilityOptions): boolean | null {
    /**
     * A WebDriver BiDi session gives a script an element that the page removed, or (in
     * Firefox) an element of the document of a page that was navigated away from, where a
     * WebDriver Classic session fails with a stale element error. Fail the same way, so the
     * element is found again instead of being checked as a removed node
     */
    if ((typeof elem.isConnected === 'boolean' && !elem.isConnected) || (elem.ownerDocument && elem.ownerDocument !== document)) {
        throw new Error('stale element reference: element is not attached to the page document')
    }
    if (typeof elem.checkVisibility === 'function') {
        return elem.checkVisibility(params)
    }
    // Fallback to legacy script if checkVisibility is not available
    return null
}
