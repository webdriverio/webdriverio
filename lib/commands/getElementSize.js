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
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdSize = [];

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdSize(val.ELEMENT, function(err,res) {
                    response.elementIdSize.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdSize && response.elementIdSize.length === 1) {

            value = {
                width: response.elementIdSize[0].value.width,
                height: response.elementIdSize[0].value.height
            };

        } else if(response.elementIdSize && response.elementIdSize.length > 1) {

            value = response.elementIdSize.map(function(res) {
                return {
                    width: res.value.width,
                    height: res.value.height
                };
            });

        }

        callback(err, value, response);

    });

};