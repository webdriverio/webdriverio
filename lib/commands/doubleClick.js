var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function doubleClick (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with doubleClick command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.moveTo(res.value.ELEMENT, cb);
        },
        function(res, cb) {
            response.moveTo = res;
            self.doDoubleClick(cb);
        },
        function(res, cb) {
            response.doDoubleClick = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};