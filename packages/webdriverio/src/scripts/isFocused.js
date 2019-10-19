/**
 * Check if given element is focused.
 * @param  {HTMLElement} elem  - Element to check
 * @return {Boolean}           - True if element is focused
 */
export default function (elem) {
    return elem === document.activeElement
}
