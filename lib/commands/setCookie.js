exports.command = function(cookieObj, callback) {
    this.cookie(cookieObj, function(result) {
        if (typeof callback == "function") {
            callback(result && result.value);
        }
    });
};