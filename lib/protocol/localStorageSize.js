/**
 *
 * protocol bindings to get local_storage size. (Not part of the official Webdriver specification)
 *
 * @returns {Number} The number of items in the storage.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidlocal_storagesize
 * @type protocol
 *
 */

let localStorageSize = function () {
    return this.requestHandler.create('/session/:sessionId/local_storage/size')
}

export default localStorageSize
