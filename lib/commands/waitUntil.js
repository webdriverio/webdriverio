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
 * @callbackParameter result
 *
 * @uses utility/pause
 * @type utility
 *
 */

var q = require('q'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function waitUntil(condition, ms, starttime) {

    starttime = starttime || new Date().getTime();

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    var promise;

    if(typeof condition === 'function') {
        promise = condition.call(this);
    } else if(q.isPromiseAlike(condition)) {
        promise = condition;
    } else {
        throw new ErrorHandler.CommandError('waitUntil condition needs to be a promise or a function that returns a promise');
    }

    if(!promise.isFulfilled() || !promise.inspect().value) {

        var now = new Date().getTime();
        if(now - starttime > ms) {

            if(promise.isRejected()) {
                throw new ErrorHandler.CommandError('Promise was fulfilled but got rejected with the following reason: ' + promise.inspect().reason);
            } else if(promise.isFulfilled() && !promise.inspect().value) {
                throw new ErrorHandler.CommandError('Promise was fulfilled with a falsy value');
            }

            throw new ErrorHandler.CommandError('Promise never resolved with an truthy value');

        }

        return this.pause(250).waitUntil(condition, ms, starttime);
    }

    return promise.inspect().value;

};
