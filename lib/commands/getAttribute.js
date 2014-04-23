var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getAttribute (selector, attributeName) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string' || typeof attributeName !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getAttribute command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.elementIdAttribute(res.value.ELEMENT, attributeName, cb);
        },
        function(res, cb) {
            response.elementIdAttribute = res;
            cb();
        }
    ], function(err) {

        callback(err, response.elementIdAttribute.value || {} ,response);

    });

};

