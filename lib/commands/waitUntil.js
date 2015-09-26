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
 *
 * @uses utility/pause
 * @type utility
 *
 */

import CommandError from '../utils/ErrorHandler.js'

const REJECT_MESSAGE = 'Promise never resolved with an truthy value'

let waitUntil = function (condition, ms, starttime = new Date().getTime()) {
    let promise

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    if (typeof condition === 'function') {
        promise = condition.call(this)
    } else {
        promise = Promise.resolve(condition)
    }

    var now = new Date().getTime()
    var timeLeft = ms - (now - starttime)
    timeLeft = timeLeft < 0 ? 0 : timeLeft

    if (!timeLeft) {
        return Promise.reject(new CommandError(REJECT_MESSAGE))
    }

    return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
            reject(new CommandError(REJECT_MESSAGE))
        }, timeLeft < 0 ? 0 : timeLeft)

        promise.then((res) => {
            clearTimeout(timeout)

            if (!res) {
                return resolve(this.pause(250).waitUntil(condition, ms, starttime))
            }

            resolve(res)
        }, (err) => {
            clearTimeout(timeout)
            reject(new CommandError(`Promise was fulfilled but got rejected with the following reason: ${err}`))
        })
    })
}

export default waitUntil
