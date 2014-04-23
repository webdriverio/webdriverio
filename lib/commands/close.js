var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function close (newTabID) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof newTabID === 'function') {
        callback = newTabID;
        newTabID = null;
    } else if(typeof newTabID !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with close command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.window(cb);
        },
        function(res,cb) {
            response.window = response;
            self.switchTab(newTabID, cb);
        },
        function(val, res, cb) {
            response.switchTab = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};