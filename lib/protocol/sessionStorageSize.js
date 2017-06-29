/**
 *
 * Protocol bindings to get the session storage size. (Not part of the official
 * Webdriver specification).
 *
 * @return {Number} The number of items in the storage.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidsession_storagesize
 * @type protocol
 *
 */

export default function sessionStorageSize () {
    return this.requestHandler.create('/session/:sessionId/session_storage/size')
}
