/**
 *
 * Perform a flick down on an element.
 *
 * @param {String} selector   element to drag on
 * @param {Number} duration   time (in seconds) to spend performing the drag
 *
 * @uses mobile/flick
 * @type mobile
 *
 */

module.exports = function flickDown(selector, duration) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof selector !== 'string') {
        selector = null;
    }

    /*!
     * set default duration if not set
     */
    if(typeof duration !== 'number') {
        duration = 0.3;
    }

    this.flick(selector, 0, 0.5, duration, callback);

};