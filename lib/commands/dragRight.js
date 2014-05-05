/**
 *
 * Perform a drag right on an element (works only on [Appium](http://appium.io/))
 *
 * @param {String} selector   element to drag on
 * @param {Number} touchCount how many fingers to drag with
 * @param {Number} duration   time (in seconds) to spend performing the drag
 *
 * @uses mobile/swipe
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function dragRight (selector, touchCount, duration) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with dragRight command'));
    }

    if(arguments.length === 2 && typeof touchCount === 'function') {
        touchCount = null;
        duration = null;
    } else if(arguments.length === 3 && typeof duration === 'function') {
        duration = null;
    }

    this.swipe(selector,0.3,0.5,0.7,0.5,touchCount,duration,callback);

};