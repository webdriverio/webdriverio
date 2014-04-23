var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js'),
    isMobileHelper = require('../helpers/isMobile');

module.exports = function getOrientation () {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        isMobile = isMobileHelper(this.desiredCapabilities),
        self = this,
        response = {};

    if(!isMobile) {
        return callback(new ErrorHandler.CommandError('getOrientation command is not supported on non mobile platforms'));
    }

    async.waterfall([
        function(cb) {
            self.orientation(cb);
        },
        function(res, cb) {
            response.orientation = res;
            cb();
        }
    ], function(err) {

        var value = response.orientation && response.orientation.value;

        callback(err, value.toLowerCase(), response);

    });

};