var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getText (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getText command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.elementIdText(res.value.ELEMENT, cb);
        },
        function(res, cb) {
            response.elementIdText = res;
            cb();
        }
    ], function(err) {

        callback(err, response.elementIdText.value, response);

    });

};