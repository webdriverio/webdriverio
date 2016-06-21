/**
 *
 * This wait command is your universal weapon if you want to wait on
 * something. It expects a condition and waits until that condition
 * is fulfilled with an truthy value. A condition can be either a promise
 * or a command that returns a promise.
 *
 * A common example is to wait until a certain element contains a certain
 * text.
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
    // synchronous usage
    browser.waitUntil(function () {
      return browser.getText('#someText') === 'I am now different'
    }, 5000, 'expected text to be different after 5s');

    // asynchronous usage
    return browser.waitUntil(function async () {
      return browser.getText('#someText').then(function(text) {
        return text === 'I am now different'
      });
    }, 5000, 'expected text to be different after 5s');
 * </example>
 *
 *
 * @alias browser.waitUntil
 * @param {Function|Promise} condition  condition to wait on
 * @param {Number=}          timeout    timeout in ms (default: 500)
 * @param {String=}          timeoutMsg error message to throw when waitUntil times out
 * @param {Number=}          interval   interval between condition checks (default: 500)
 * @uses utility/pause
 * @type utility
 *
 */

import { WaitUntilTimeoutError } from '../utils/ErrorHandler'
import Timer from '../utils/Timer'

export default function (condition, timeout, timeoutMsg, interval) {
    /*!
     * ensure that timeout and interval are set properly
     */
    if (typeof timeout !== 'number') {
        timeout = this.options.waitforTimeout
    }

    if (typeof interval !== 'number') {
        interval = this.options.waitforInterval
    }

    let fn

    if (typeof condition === 'function') {
        fn = condition.bind(this)
    } else {
        fn = () => Promise.resolve(condition)
    }

    let isSync = this.options.sync
    let timer = new Timer(interval, timeout, fn, true, isSync)

    return timer.catch(function (e) {
        if (e === 'timeout' && typeof timeoutMsg === 'string') {
            throw new WaitUntilTimeoutError(timeoutMsg)
        }
        throw new WaitUntilTimeoutError(`Promise was rejected with the following reason: ${e}`)
    })
}
