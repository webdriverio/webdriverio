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
 * @param {Number=}          timeout    timeout in ms (default: 500)
 * @param {Number=}          interval   interval between condition checks (default: 250)
 *
 * @uses utility/pause
 * @type utility
 *
 */

var q = require('q'),
    ErrorHandler = require('../utils/ErrorHandler.js'),
    Timer = require('../utils/Timer.js');

module.exports = function waitUntil(condition, timeout, interval) {
    /*!
     * ensure that timeout and interval are set properly
     */
    if (typeof timeout !== 'number') {
        timeout = this.options.waitforTimeout;
    }

    if (typeof interval !== 'number') {
        interval = this.options.waitforInterval;
    }

    var fn;

    if (typeof condition === 'function') {
        fn = condition.bind(this);
    } else if (q.isPromiseAlike(condition)) {
        fn = function() {
            return condition;
        };
        // no need to wait more
        timeout = interval;
    } else {
        throw new ErrorHandler.CommandError('waitUntil condition needs to be a promise or a function that returns a promise');
    }

    var timer = new Timer(interval, timeout, fn, true);

    return timer.catch(function(err) {
        throw new ErrorHandler.CommandError('Promise was rejected with the following reason: ' + err);
    });

};
