/**
 *
 * Set the amount of time, in milliseconds, that asynchronous scripts executed
 * by /session/:sessionId/execute_async are permitted to run before they are
 * aborted and a |Timeout| error is returned to the client.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors. Please use the
 * [`timeouts`](http://webdriver.io/api/protocol/timeouts.html) command instead.
 *
 * @see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtimeoutsasync_script
 *
 * @param {Number} ms   The amount of time, in milliseconds, that time-limited commands are permitted to run.
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import deprecate from '../helpers/deprecationWarning'

export default function timeoutsAsyncScript (ms) {
    /*!
     * parameter check
     */
    if (typeof ms !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with timeoutsAsyncScript protocol command')
    }

    deprecate(
        'timeoutsAsyncScript',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. It is recommended to use the timeout command for this.'
    )
    return this.requestHandler.create('/session/:sessionId/timeouts/async_script', { ms })
}
