/**
 * check if element is visible and within the viewport
 * @param  {HTMLElement} elem  element to check
 * @return {Boolean}           true if element is within viewport
 */
export default function isDisplayedInViewport (elem) {
    const dde = document.documentElement

    let isWithinViewport = true
    while (elem.parentNode && elem.parentNode.getBoundingClientRect) {
        const elemDimension = elem.getBoundingClientRect()
        const elemComputedStyle = window.getComputedStyle(elem)
        const viewportDimension = {
            width: dde.clientWidth,
            height: dde.clientHeight
        }

        isWithinViewport = isWithinViewport &&
                           (elemComputedStyle.display !== 'none' &&
                            elemComputedStyle.visibility === 'visible' &&
                            parseFloat(elemComputedStyle.opacity, 10) > 0 &&
                            elemDimension.bottom > 0 &&
                            elemDimension.right > 0 &&
                            elemDimension.top < viewportDimension.height &&
                            elemDimension.left < viewportDimension.width)

        elem = elem.parentNode
    }

    return isWithinViewport
}
