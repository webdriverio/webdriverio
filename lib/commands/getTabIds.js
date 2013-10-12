exports.command = function(callback) {
    this.windowHandles(function(err, result) {
        if (typeof callback === 'function') {
            callback(err, result && result.value);
        }
    });
};