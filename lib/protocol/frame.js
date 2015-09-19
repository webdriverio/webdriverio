/**
 * Change focus to another frame on the page. If the frame id is null,
 * the server should switch to the page's default content.
 *
 * @param {String|Number|null|WebElementJSONObject} id   Identifier for the frame to change focus to.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame
 * @type protocol
 *
 */

let frame = function (frameId = null) {
    return this.requestHandler.create('/session/:sessionId/frame', {
        id: frameId
    })
}

export default frame
