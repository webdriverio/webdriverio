var fs = require('fs'),
    async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function chooseFile(selector, localPath) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string' || typeof localPath !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with chooseFile command'));
    }

    var self = this,
        response = {};

    fs.exists(localPath, function(exists) {

        /* istanbul ignore next */
        if (!exists) {
            return callback(new ErrorHandler.CommandError('File to upload does not exists on your system'));
        }

        async.waterfall([
            function(cb) {
                self.uploadFile(localPath, cb);
            },
            function(res, cb) {
                response.uploadFile = res;
                self.addValue(selector, res.value, cb);
            },
            function(val, res, cb) {
                response.addValue = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    });

};