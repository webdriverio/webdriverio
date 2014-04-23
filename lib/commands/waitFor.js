var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function waitFor (selector, ms) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with waitFor command'));
    }

    /**
     * ensure that ms is set properly
     */
    if(typeof ms !== 'number') {
        ms = 500;
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.implicitWait(ms, cb);
        },
        function(res, cb) {
            response.implicitWait = res;
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            /**
             * previous implementation called
             * this.implicitWait(0, function() {
             *     callback(err, result);
             * });
             * again, may need to be readded
             */
            cb();
        }
    ], function(err) {

        callback(err,null,response);

    });

};