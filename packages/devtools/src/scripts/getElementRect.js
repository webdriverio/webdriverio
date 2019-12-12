/**
 * get element rect
 */
export default function getElementRect (html, elem) {
    const { x, y, width, height } = elem.getBoundingClientRect()
    return { x, y, width, height }
}
