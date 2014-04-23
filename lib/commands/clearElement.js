var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function clearElement (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with clearElement command'));
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
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};