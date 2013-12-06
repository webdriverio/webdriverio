module.exports = function setCookie (cookieObj, callback) {
    this.cookie(cookieObj, function(err, result) {
        callback(err, result && result.value);
    });
};