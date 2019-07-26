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

/**
 * cleans up temporary attribute that is used to query element
 * with protractor
 */
export function cleanUp (elem, dataProperty) {
    return elem.removeAttribute(dataProperty)
}
