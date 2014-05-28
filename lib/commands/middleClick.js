/**
 *
 * Apply middle click on an element. If selector is not provided, click on the last
 * moved-to location.
 *
 * @param {String} selector element to click on
 * @uses protocol/element, protocol/buttonPress
 *
 */

var handleMouseButtonCommand = require('../helpers/handleMouseButtonCommand'),
    isMobileHelper = require('../helpers/isMobile');

module.exports = function middleClick (cssSelector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(!isMobileHelper(this.desiredCapabilities)) {

        handleMouseButtonCommand.call(this, cssSelector, 'middle', callback);

    } else {

        this.tap(selector,callback);

    }

};