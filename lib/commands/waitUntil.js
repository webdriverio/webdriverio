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
    client.waitUntil(function() {
      return this.getText('#someText').then(function(text) {
        return text === 'I am now different'
      });
    });
 * </example>
 *
 *
 * @param {Function|Promise} condition  condition to wait on
 * @param {Number=}          ms         timeout in ms (default: 500)
 * @param {Number=}          interval   interval between condition checks (default: 250)
 *
 * @uses utility/pause
 * @type utility
 *
 */

import { CommandError } from '../utils/ErrorHandler'

const REJECT_MESSAGE = 'Promise never resolved with an truthy value'

function waitUntilPrivate (condition, timeout, interval, starttime) {
    let promise

    var now = new Date().getTime()
    var timeLeft = timeout - (now - starttime)
    timeLeft = timeLeft < 0 ? 0 : timeLeft

    if (!timeLeft) {
        return Promise.reject(new CommandError(REJECT_MESSAGE))
    }

    if (typeof condition === 'function') {
        promise = condition.call(this)
    } else {
        promise = Promise.resolve(condition)
    }

    return new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
            reject(new CommandError(REJECT_MESSAGE))
        }, timeLeft)

        promise.then((res) => {
            clearTimeout(timeoutId)

            if (!res) {
                return resolve(this.pause(interval).then(
                    waitUntilPrivate.bind(this, condition, timeout, interval, starttime)
                ))
            }

            resolve(res)
        }, (err) => {
            clearTimeout(timeoutId)
            reject(new CommandError(`Promise was fulfilled but got rejected with the following reason: ${err}`))
        })
    })
}

export default function (condition, timeout, interval) {
    /*!
     * ensure that timeout and interval are set properly
     */
    if (typeof timeout !== 'number') {
        timeout = this.options.waitforTimeout
    }

    if (typeof interval !== 'number') {
        interval = this.options.waitforInterval
    }

    let starttime = new Date().getTime()
    return waitUntilPrivate.call(this, condition, timeout, interval, starttime)
}
