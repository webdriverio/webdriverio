/**
 *
 * protocol bindings to get local_storage size
 *
 * @returns {Number} The number of items in the storage.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/local_storage/size
 * @type protocol
 *
 */

let localStorageSize = function () {
    return this.requestHandler.create('/session/:sessionId/local_storage/size')
}

export default localStorageSize
