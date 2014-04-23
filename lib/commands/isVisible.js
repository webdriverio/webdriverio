var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function isVisible (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with isVisible command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.elementIdDisplayed(res.value.ELEMENT, 'value', cb);
        },
        function(res, cb) {
            response.elementIdDisplayed = res;
            cb();
        }
    ], function(err) {

        callback(err, response.elementIdDisplayed.value, response);

    });

};