/**
 *
 * Pulls a file from the device.
 *
 * <example>
    :pullFile.js
    browser.pullFile('/data/local/tmp/file.txt')
 * </example>
 *
 * @param {String} path  device path to file
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#pull-file
 * @type mobile
 * @for ios, android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function pullFile (path) {
    if (typeof path !== 'string') {
        throw new ProtocolError('pullFile requires a parameter (path to file) from type string')
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/pull_file',
        method: 'POST'
    }, { path })
}
