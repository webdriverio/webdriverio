/**
 *
 * Set a device orientation.
 *
 * <example>
    :setOrientation.js
    it('should set a geo location for the device', function () {
        browser.setOrientation('landscape');

        var orientation = browser.getOrientation();
        console.log(orientation); // outputs: "landscape"
    });
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
