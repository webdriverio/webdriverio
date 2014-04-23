var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setValue (selector, value) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string' || (typeof value !== 'string' && Object.prototype.toString.call(value) !== '[object Array]')) {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with setValue command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.elementIdClear(res.value.ELEMENT, cb);
        },
        function(res, cb) {
            response.elementIdClear = res;
            self.elementIdValue(response.element.value.ELEMENT, value, cb);
        },
        function(res, cb) {
            response.elementIdValue = res;
            cb();
        }
    ], function(err) {

        callback(err,null,response);

    });

};