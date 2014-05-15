var wait = require('../utils/wait'),
    isVisible = require('./isVisible');

module.exports = function waitForInvisible(selector, ms, interval, callback) {
    wait.call(this, isVisible, false, selector, ms, interval, callback);
};