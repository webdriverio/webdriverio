/**
 *
 * Perform a flick on the screen or an element. If you want to flick on a specific
 * element make sure you provide a selector argument. If not just pass `xoffset`
 * and `yoffset` as command arguments.
 *
 * start at a particulat screen location
 *
 * @param {String=} selector   element to flick on
 * @param {Number=} xoffset    x offset of flick gesture (in pixels or relative units)
 * @param {Number=} yoffset    y offset of flick gesture (in pixels or relative units)
 * @param {Number=} speed      time (in seconds) to spend performing the flick
 *
 * @uses protocol/element, protocol/touchFlick
 * @type mobile
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function flick(selector, xoffset, yoffset, speed) {

    var self = this;

    /*!
     * mobile check
     */
    if (!this.isMobile) {
        throw new ErrorHandler.CommandError('flick command is not supported on non mobile platforms');
    }

    if (arguments.length === 2 && typeof selector === 'number' && typeof xoffset === 'number') {

        /*!
         * you don't care where the flick starts on the screen
         */

        var xspeed = arguments[0],
            yspeed = arguments[1];

        return self.touchFlick(xspeed, yspeed);

    } else {

        /*!
         * command starts at a particular screen location
         */

        return self.element(selector)
            .then(function (res) {
                return self.touchFlick(res.value.ELEMENT.toString(), xoffset, yoffset, speed);
            });

    }

};

