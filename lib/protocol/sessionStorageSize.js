/**
 *
 * Protocol bindings to get the session storage size. (Not part of the official Webdriver specification).
 *
 * @returns {Number} The number of items in the storage.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidsession_storagesize
 * @type protocol
 *
 */

let sessionStorageSize = function () {
    return this.requestHandler.create('/session/:sessionId/session_storage/size')
}

export default sessionStorageSize
