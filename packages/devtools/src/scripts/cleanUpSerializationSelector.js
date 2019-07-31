/**
 * cleans up temporary attribute that is used to query element
 * with protractor
 */
export default function cleanUp (elem, dataProperty) {
    return elem.removeAttribute(dataProperty)
}
