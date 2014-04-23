var async = require('async'),
    fs = require('fs'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function saveScreenshot (fileName) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof fileName !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with saveScreenshot command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.screenshot(cb);
        },
        function(res, cb) {
            response.screenshot = res;
            fs.writeFile(fileName, res.value, 'base64', cb);
        },
        function(res, cb) {
            response.writeFile = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};