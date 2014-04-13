module.exports = function getGeoLocation (callback) {
    this.location(function(err, result) {
        if (typeof callback === 'function') {
            callback(err, result && result.value);
        }
    });
};