/**
 *
 * Set the current browser orientation.
 *
 * <example>
    :setOrientationAsync.js
    client
        .setOrientation('landscape')
        .getOrientation(function(err, orientation) {
            console.log(orientation); // outputs: "landscape"
        })
        .end();
 * </example>
 *
 * @alias browser.setOrientation
 * @param {String} orientation the new browser orientation (`landscape/portrait`)
 * @uses protocol/orientation
 * @type mobile
 * @for android, ios
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let setOrientation = function (orientation) {
    /*!
     * parameter check
     */
    if (typeof orientation !== 'string') {
        throw new CommandError('number or type of arguments don\'t agree with setOrientation command')
    }

    return this.orientation(orientation.toUpperCase())
}

export default setOrientation
