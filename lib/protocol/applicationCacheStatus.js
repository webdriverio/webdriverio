/**
 *
 * Get the status of the html5 application cache.
 *
 * @returns {Number} Status code for application cache: **{UNCACHED = 0, IDLE = 1, CHECKING = 2, DOWNLOADING = 3, UPDATE_READY = 4, OBSOLETE = 5}**
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidapplication_cachestatus
 * @type protocol
 *
 */

let applicationCacheStatus = function () {
    return this.requestHandler.create('/session/:sessionId/application_cache/status')
}

export default applicationCacheStatus
