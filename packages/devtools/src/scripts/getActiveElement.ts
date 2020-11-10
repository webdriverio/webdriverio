/**
 * returns active element of document
 */
export default function getActiveElement (_: HTMLElement, dataProperty: string) {
    if (!document.activeElement) {
        return false
    }

    document.activeElement.setAttribute(dataProperty, 'true')
    return true
}
