exports.command = function(callback) {
    this.window_handle(function(err, result) {
        if (typeof callback == "function") {
            callback(err, result && result.value);
        }
    });
};