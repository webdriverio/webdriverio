/**
 * check if element is visible and within the viewport
 *
 * @param {String}  elements  DOM elements to check against
 *
 * @see  waitForVisible
 */

let isWithinViewport = function (elements) {
    var dde = document.documentElement
    var result = []

    if (elements.length === 0) {
        throw new Error('NoSuchElement')
    }

    for (var i = 0; i < elements.length; ++i) {
        var elem = elements[i]
        var isWithinViewport = true

        while (elem.parentNode && elem.parentNode.getBoundingClientRect) {
            var elemDimension = elem.getBoundingClientRect()
            var elemComputedStyle = window.getComputedStyle(elem)
            var viewportDimension = {
                width: dde.clientWidth,
                height: dde.clientHeight
            }

            // if static, we can ignore its position, height and width attribute
            if (elemComputedStyle.position === '' ||
                elemComputedStyle.position === 'static') {
                isWithinViewport = isWithinViewport &&
                                (elemComputedStyle.display !== 'none' &&
                                 elemComputedStyle.visibility === 'visible' &&
                                 parseFloat(elemComputedStyle.opacity) > 0)
            } else {
                isWithinViewport = isWithinViewport &&
                               (elemComputedStyle.display !== 'none' &&
                                elemComputedStyle.visibility === 'visible' &&
                                parseFloat(elemComputedStyle.opacity) > 0 &&
                                elemDimension.bottom > 0 &&
                                elemDimension.right > 0 &&
                                elemDimension.top < viewportDimension.height &&
                                elemDimension.left < viewportDimension.width)
            }

            elem = elem.parentNode
        }
        result.push(isWithinViewport)
    }
    return result
}

export default isWithinViewport
