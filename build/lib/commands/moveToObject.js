/**
 *
 * Move the mouse by an offset of the specificed element. If an element is provided but no
 * offset, the mouse will be moved to the center of the element. If the element is not
 * visible, it will be scrolled into view.
 *
 * @param {String} selector element to move to
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 *
 * @uses protocol/element, protocol/elementIdLocation
 * @type action
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var moveToObject = function moveToObject(selector, xoffset, yoffset) {
    var _this = this;

    /**
     * check for offset params
     */
    var hasOffsetParams = true;
    if (typeof xoffset !== 'number' && typeof yoffset !== 'number') {
        hasOffsetParams = false;
    }

    if (this.isMobile) {
        return this.element(selector).then(function (res) {
            return _this.elementIdSize(res.value.ELEMENT).then(function (size) {
                return _this.elementIdLocation(res.element.value.ELEMENT).then(function (location) {
                    return { size: size, location: location };
                });
            });
        }).then(function (res) {
            var x = res.location.value.x + res.size.value.width / 2;
            var y = res.location.value.y + res.size.value.height / 2;

            if (hasOffsetParams) {
                x = res.location.value.x + xoffset;
                y = res.location.value.y + yoffset;
            }

            return _this.touchMove(x, y);
        });
    }

    return this.element(selector).then(function (res) {
        return _this.moveTo(res.value.ELEMENT, xoffset, yoffset);
    });
};

exports['default'] = moveToObject;
module.exports = exports['default'];
