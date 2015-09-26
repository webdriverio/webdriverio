/**
 *
 * Set the amount of time, in milliseconds, that asynchronous scripts executed
 * by /session/:sessionId/execute_async are permitted to run before they are
 * aborted and a |Timeout| error is returned to the client.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/timeouts/async_script
 *
 * @param {Number} ms   The amount of time, in milliseconds, that time-limited commands are permitted to run.
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let timeoutsAsyncScript = function (ms) {
    /*!
     * parameter check
     */
    if (typeof ms !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with timeoutsAsyncScript protocol command')
    }

    return this.requestHandler.create('/session/:sessionId/timeouts/async_script', {
        ms: ms
    })
}

export default timeoutsAsyncScript
