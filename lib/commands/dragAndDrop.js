/**
 *
 * Drag an item to a destination element.
 *
 * @alias browser.dragAndDrop
 * @param {String} sourceElem      source selector
 * @param {String} destinationElem destination selector
 * @uses action/moveToObject, protocol/buttonDown, protocol/buttonUp, property/getLocation, protocol/touchDown, protocol/touchMove, protocol/touchUp
 * @type action
 *
 */

let dragAndDrop = function (selector, destinationElem) {
    if (this.isMobile) {
        return this.getLocation(selector).then(
            (location) => this.touchDown(location.x, location.y)
        ).getLocation(destinationElem).then(
            (location) => this.touchMove(location.x, location.y).touchUp(location.x, location.y)
        )
    }

    return this.moveToObject(selector).buttonDown().moveToObject(destinationElem).buttonUp()
}

export default dragAndDrop
