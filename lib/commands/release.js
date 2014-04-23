var async = require('async'),
    isMobileHelper = require('../helpers/isMobile'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function release (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * compatibility check
     */
    if(!isMobileHelper(this.desiredCapabilities)) {
        return callback(new ErrorHandler.CommandError('release command is not supported on non mobile platforms'));
    }
    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with release command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.getLocation(selector, cb);
        },
        function(res, cb) {
            response.getLocation = res;
            self.touchUp(res.x, res.y, cb);
        },
        function(res, cb) {
            response.touchUp = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};