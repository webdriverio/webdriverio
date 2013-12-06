module.exports = function getCurrentTabId (callback) {
    this.windowHandle(function(err, result) {
        if (typeof callback == 'function') {
            callback(err, result && result.value);
        }
    });
};