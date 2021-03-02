/**
 * returns active element of document
 */
export default function getActiveElement (_: Element, dataProperty: string) {
    if (!document.activeElement) {
        return false
    }

    document.activeElement.setAttribute(dataProperty, 'true')
    return true
}
