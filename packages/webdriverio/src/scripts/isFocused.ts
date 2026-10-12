/**
 * checks if given element is focused
 * @param  {HTMLElement} elem  element to check
 * @return {Boolean}           true if element is focused
 */
export default function isFocused (elem: Element) {
    /**
     * A WebDriver BiDi session gives a script an element that the page removed, or (in
     * Firefox) an element of the document of a page that was navigated away from, where a
     * WebDriver Classic session fails with a stale element error. Fail the same way, so the
     * element is found again instead of being checked as a removed node
     */
    if ((typeof elem.isConnected === 'boolean' && !elem.isConnected) || (elem.ownerDocument && elem.ownerDocument !== document)) {
        throw new Error('stale element reference: element is not attached to the page document')
    }
    return elem === document.activeElement
}
