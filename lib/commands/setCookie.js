exports.command = function(cookieObj, callback) {
    this.cookie(cookieObj, function(err, result) {
        if (typeof callback == "function") {
            callback(err, result && result.value);
        }
    });
};