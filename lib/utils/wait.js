/**
 * wait function, plug in a webdriverjs fn (e.g. isVisible) and an expected result.
 * this helper should be used by commands (e.g. waitForVisible)
 * it retries the requested action until the expectations are met or it times out.
 */

module.exports = function (fn, expectation, selector, ms, callback) {
  var poll, interval, self, timeout;
  timeout = Date.now() + ms;
  interval = 100;
  self = this;
  poll = function () {
    fn.call(self, selector, function (err, result) {
      if (err) {
        callback(err);
      } else if (result === expectation) {
        callback();
      } else {
        if ((Date.now() + interval) >= timeout) {
          callback(new Error(['element', selector, 'did not meet expectation within', ms, 'ms'].join(' ')));
        } else {
          // keep this one at bottom for tail-call optimization
          setTimeout(poll, interval);
        }
      }
    });
  };
  poll(ms);
};