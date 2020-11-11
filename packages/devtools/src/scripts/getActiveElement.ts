/**
 * returns active element of document
 */
export default function getActiveElement (_: Element, dataProperty: unknown) {
    if (!document.activeElement) {
        return false
    }

    document.activeElement.setAttribute(dataProperty as string, 'true')
    return true
}
