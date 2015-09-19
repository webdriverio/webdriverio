/**
 *
 * Protocol bindings to get the session storage size.
 *
 * @returns {Number} The number of items in the storage.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/session_storage/size
 * @type protocol
 *
 */

let sessionStorageSize = function () {
    return this.requestHandler.create('/session/:sessionId/session_storage/size')
}

export default sessionStorageSize
