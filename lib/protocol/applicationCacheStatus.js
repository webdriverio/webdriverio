/**
 *
 * Get the status of the html5 application cache.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @return {Number} Status code for application cache: **{UNCACHED = 0, IDLE = 1, CHECKING = 2, DOWNLOADING = 3, UPDATE_READY = 4, OBSOLETE = 5}**
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidapplication_cachestatus
 * @type protocol
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function applicationCacheStatus () {
    deprecate('applicationCacheStatus', this.options)
    return this.requestHandler.create('/session/:sessionId/application_cache/status')
}
