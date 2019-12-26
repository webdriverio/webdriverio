/**
 * returns active element of document
 */
export default function getActiveElement (_, dataProperty) {
    if (!document.activeElement) {
        return false
    }

    document.activeElement.setAttribute(dataProperty, true)
    return true
}
