exports.command = function(tabID, callback) {
    this.window_handles(function(err, result) {
        if (typeof callback == "function") {
            callback(err, result && result.value);
        }
    });
};