/**
 * wait function, plug in a webdriverjs fn (e.g. isVisible) and an expected result.
 * this helper should be used by commands (e.g. waitForVisible)
 * it retries the requested action until the expectations are met or it times out.
 * optionally a polling interval can be specified to reduce performance hits.
 */

module.exports = function (fn, expectation, selector, ms, interval, callback) {
    var poll, self, timeout, now;
    if(typeof interval === 'function') {
        callback = interval;
        interval = 100;
    }
    timeout = Date.now() + ms;
    self = this;
    poll = function () {
        fn.call(self, selector, function (err, result) {
            if (err) {
                callback(err);
            } else if (result === expectation) {
                callback();
            } else {
                now = Date.now();
                if (now > timeout) {
                    callback(new Error(['element', selector, 'did not meet expectation within', ms, 'ms'].join(' ')));
                } else {
                    // keep this one at bottom for tail-call optimization
                    setTimeout(poll, (now + interval <= timeout) ? interval : timeout - now);
                }
            }
        });
    };
    poll(ms);
};