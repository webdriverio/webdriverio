var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getLocationInView (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getLocationInView command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.elementIdLocationInView(res.value.ELEMENT, cb);
        },
        function(res, cb) {
            response.elementIdLocationInView = res;
            cb();
        }
    ], function(err) {

        var value = {
            x: parseInt(response.elementIdLocationInView.value.x,10),
            y: parseInt(response.elementIdLocationInView.value.y,10)
        };

        callback(err, value, response);

    });

};