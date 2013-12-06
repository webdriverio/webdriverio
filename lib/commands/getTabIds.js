module.exports = function getTabIds (callback) {
    this.windowHandles(function(err, result) {
        if (typeof callback === 'function') {
            callback(err, result && result.value);
        }
    });
};