/**
 *
 * This wait command is your universal weapon if you want to wait on something. It expects a condition
 * and waits until that condition is fulfilled with a truthy value. If you use the WDIO testrunner the
 * commands within the condition are getting executed synchronously like in your test.
 *
 * A common example is to wait until a certain element contains a certain text (see example).
 *
 * <example>
    :example.html
    <div id="someText">I am some text</div>
    <script>
      setTimeout(function() {
        $('#someText').html('I am now different');
      }, 1000);
    </script>

    :waitUntil.js
    it('should wait until text has changed', function () {
        browser.waitUntil(function () {
          return browser.getText('#someText') === 'I am now different'
        }, 5000, 'expected text to be different after 5s');
    });
 * </example>
 *
 *
 * @alias browser.waitUntil
 * @param {Function} condition  condition to wait on
 * @param {Number=}  timeout    timeout in ms (default: 500)
 * @param {String=}  timeoutMsg error message to throw when waitUntil times out
 * @param {Number=}  interval   interval between condition checks (default: 500)
 * @uses utility/pause
 * @type utility
 *
 */

import { WaitUntilTimeoutError, CommandError } from '../utils/ErrorHandler'
import Timer from '../utils/Timer'

export default function (condition, timeout, timeoutMsg, interval) {
    if (typeof condition !== 'function') {
        throw new CommandError('invalid argument')
    }

    /*!
     * ensure that timeout and interval are set properly
     */
    if (typeof timeout !== 'number') {
        timeout = this.options.waitforTimeout
    }

    if (typeof interval !== 'number') {
        interval = this.options.waitforInterval
    }

    const fn = condition.bind(this)
    let isSync = this.options.sync
    let timer = new Timer(interval, timeout, fn, true, isSync)

    return timer.catch((e) => {
        if (e.message === 'timeout' && typeof timeoutMsg === 'string') {
            throw new WaitUntilTimeoutError(timeoutMsg)
        }

        if (e.type === 'NoSuchElement') {
            throw new WaitUntilTimeoutError(e.message)
        }

        throw new WaitUntilTimeoutError(`Promise was rejected with the following reason: ${e.message}`)
    })
}
