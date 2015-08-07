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

var q = require('q'),
    ErrorHandler = require('../utils/ErrorHandler.js'),
    reject = function(d) {
        d.reject(new ErrorHandler.CommandError('Promise never resolved with an truthy value'));
    };

module.exports = function waitUntil(condition, ms, starttime) {

    starttime = starttime || new Date().getTime();

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    var self = this,
        defer = q.defer(),
        promise;

    if(typeof condition === 'function') {
        promise = condition.call(this);
    } else if(q.isPromiseAlike(condition)) {
        promise = condition;
    } else {
        throw new ErrorHandler.CommandError('waitUntil condition needs to be a promise or a function that returns a promise');
    }

    var now = new Date().getTime();
    var timeLeft = ms - (now - starttime);
    timeLeft = timeLeft < 0 ? 0 : timeLeft;

    if(!timeLeft) {
        reject(defer);
        return defer.promise;
    }

    var timeout = setTimeout(function() {
        reject(defer);
    }, timeLeft < 0 ? 0 : timeLeft);

    promise.then(function(res) {
        clearTimeout(timeout);

        if(!res) {
            if(q.isPromiseAlike(condition)) {
                defer.reject(new ErrorHandler.CommandError('Promise was fulfilled with a falsy value'));
            }

            return defer.resolve(self.pause(250).waitUntil(condition, ms, starttime));
        }

        defer.resolve(res);

    }, function(err) {
        clearTimeout(timeout);

        defer.reject(new ErrorHandler.CommandError('Promise was fulfilled but got rejected with the following reason: ' + err));

    });

    return defer.promise;

};
