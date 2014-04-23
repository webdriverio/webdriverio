var async = require('async');

module.exports = function getGeoLocation () {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.location(cb);
        },
        function(res, cb) {
            response.location = res;
            cb();
        }
    ], function(err) {

        // not supported yet
        var value = response.location && response.location.value;

        callback(err, value, response);

    });

};