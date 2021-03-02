/**
 * get element rect
 */
export default function getElementRect (html: HTMLElement, elem: HTMLElement) {
    const { x, y, width, height } = elem.getBoundingClientRect()
    return { x, y, width, height }
}
