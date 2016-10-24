/**
 *
 * Get the current browser orientation. This command only works for mobile environments like Android Emulator,
 * iOS Simulator or on real devices.
 *
 * <example>
    :getOrientation.js
    it('should get the orientation of my mobile device', function () {
        var orientation = browser.getOrientation();
        console.log(orientation); // outputs: "landscape"
    });
 * </example>
 *
 * @alias browser.getOrientation
 * @returns {String} device orientation (`landscape/portrait`)
 * @uses protocol/orientation
 * @for android, ios
 * @type mobile
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let getOrientation = function () {
    if (!this.isMobile) {
        throw new CommandError('getOrientation command is not supported on non mobile platforms')
    }

    return this.unify(this.orientation(), {
        lowercase: true,
        extractValue: true
    })
}

export default getOrientation
