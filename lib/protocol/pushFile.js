/**
 *
 * Pushes a file to the device.
 *
 * <example>
    :pushFile.js
    var data = new Buffer("Hello World").toString('base64'))
    browser.pushFile('/data/local/tmp/file.txt', data)
 * </example>
 *
 * @param {String} path  local path to file
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#push-file
 * @type mobile
 * @for ios, android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function pushFile (path, base64Data) {
    if (typeof path !== 'string' || typeof base64Data !== 'string') {
        throw new ProtocolError('pushFile requires two parameters (path, base64Data) from type string')
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/push_file',
        method: 'POST'
    }, {
        path,
        data: base64Data
    })
}
