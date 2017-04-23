/**
 *
 * Pulls a folder from the device's file system.
 *
 * <example>
    :pullFolder.js
    browser.pullFolder('/data/local/tmp')
 * </example>
 *
 * @param {String} path  device path to folder
 *
 * @type mobile
 * @for ios, android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function pullFolder (path) {
    if (typeof path !== 'string') {
        throw new ProtocolError('pullFolder requires a parameter (path to folder) from type string')
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/pull_folder',
        method: 'POST'
    }, { path })
}
