var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getElementSize (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getElementSize command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.elementIdSize(res.value.ELEMENT, cb);
        },
        function(res, cb) {
            response.elementIdSize = res;
            cb();
        }
    ], function(err) {

        var value = {
            width: response.elementIdSize.value.width,
            height: response.elementIdSize.value.height
        };

        callback(err, value, response);

    });

};