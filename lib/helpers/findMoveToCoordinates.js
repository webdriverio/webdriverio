/**
 * call must be scoped to the webdriverio client
 *
 * @param {String} element  Opaque ID assigned to the element to move to, as described in the WebElement JSON Object.
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @uses protocol/elementIdLocation, protocol/elementIdSize
 */
let findMoveToCoordinates = function (element, xoffset, yoffset) {
    /**
     * check for offset params
     */
    xoffset = typeof xoffset === 'number' ? xoffset : 0
    yoffset = typeof yoffset === 'number' ? yoffset : 0

    return this.elementIdSize(element).then((size) => {
        return this.elementIdLocation(element).then((location) => {
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
}

export default findMoveToCoordinates
