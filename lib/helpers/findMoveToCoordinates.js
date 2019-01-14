import { RuntimeError } from '../utils/ErrorHandler'

/**
 * call must be scoped to the webdriverio client
 */
let findMoveToCoordinates = function (selector, xoffset, yoffset) {
    /**
     * check for offset params
     */
    xoffset = typeof xoffset === 'number' ? xoffset : 0
    yoffset = typeof yoffset === 'number' ? yoffset : 0

    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        return this.elementIdSize(res.value.ELEMENT).then((size) => {
            return this.elementIdLocation(res.value.ELEMENT).then((location) => {
                let x = location.value.x + (size.value.width / 2)
                let y = location.value.y + (size.value.height / 2)

                if (xoffset > 0 || yoffset > 0) {
                    x = location.value.x + xoffset
                    y = location.value.y + yoffset
                }

                return {
                    x: Math.round(x),
                    y: Math.round(y)
                }
            })
        })
    })
}

export default findMoveToCoordinates
