/**
 * cleans up temporary attribute that is used to query element
 * with puppeteer
 */
export default function cleanUp (elem, dataProperty) {
    const elems = Array.isArray(elem) ? elem : [elem]
    for (const el of elems) {
        el.removeAttribute(dataProperty)
    }
}
