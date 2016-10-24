/**
 *
 * Release touch sequence on specific element.
 *
 * @alias browser.release
 * @param {String} selector element to release on
 * @uses property/getLocation, protocol/touchUp
 * @type mobile
 *
 */

let release = function (selector) {
    return this.getLocation(selector).then(
        (res) => this.touchUp(res.x, res.y))
}

export default release
