var wait = require('../utils/wait'),
    isVisible = require('./isVisible');

// just doing
// module.exports = wait.bind(this, isVisible, true);
// ...won't work. we need a named wrapper fn here, since the
// fn is add to the wd prototype by name
module.exports = function waitForVisible(selector, ms, interval, callback) {
    wait.call(this, isVisible, true, selector, ms, interval, callback);
};