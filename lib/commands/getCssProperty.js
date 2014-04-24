var async = require('async'),
    parseCSS = require('../helpers/parseCSS.js'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getCssProperty (selector, cssProperty) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string' || typeof cssProperty !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getCssProperty command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdCssProperty = [];

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdCssProperty(val.ELEMENT, cssProperty, function(err,res) {
                    response.elementIdCssProperty.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var parsedValue = parseCSS(response.elementIdCssProperty, cssProperty);

        callback(err, parsedValue, response);

    });

};

