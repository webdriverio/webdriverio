/**
 *
 * Set the amount of time, in milliseconds, that asynchronous scripts executed
 * by /session/:sessionId/execute_async are permitted to run before they are
 * aborted and a |Timeout| error is returned to the client.
 *
 * Deprecated! Please use the `timeouts` command instead.
 *
 * @see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtimeoutsasync_script
 *
 * @param {Number} ms   The amount of time, in milliseconds, that time-limited commands are permitted to run.
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import depcrecate from '../helpers/depcrecationWarning'

export default function timeoutsAsyncScript (ms) {
    /*!
     * parameter check
     */
    if (typeof ms !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with timeoutsAsyncScript protocol command')
    }

    depcrecate('timeoutsAsyncScript')
    return this.requestHandler.create('/session/:sessionId/timeouts/async_script', { ms })
}
