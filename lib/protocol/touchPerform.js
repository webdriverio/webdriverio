/**
 *
 * Performs a specific touch action
 *
 * @param {Object} actions  touch action as object or object[] with attributes like touchCount, x, y, duration
 *
 * @see  https://github.com/appium/node-mobile-json-wire-protocol/blob/master/docs/protocol-methods.md#mobile-json-wire-protocol-endpoints
 * @type protocol
 *
 */

let touchPerform = function (actions) {
    return this.requestHandler.create('/session/:sessionId/touch/perform', { actions })
}

export default touchPerform
