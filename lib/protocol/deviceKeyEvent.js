/**
 *
 * send a key event to the device
 *
 * @param {Number} keyValue  device specifc key value
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#key-event
 * @type mobile
 * @for android
 *
 */

export default function deviceKeyEvent (keycode, metastate) {
    let data = {
        keycode: keycode
    }

    if (metastate) {
        data.metastate = metastate
    }

    let requestOptions = {
        path: '/session/:sessionId/appium/device/keyevent',
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions, data)
}
