var async = require('async'),
    parse = require('css-value'),
    rgb2hex = require('rgb2hex'),
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
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.elementIdCssProperty(res.value.ELEMENT, cssProperty, cb);
        },
        function(res, cb) {
            response.elementIdCssProperty = res;
            cb();
        }
    ], function(err) {

        if(!response.elementIdCssProperty || !response.elementIdCssProperty.value) {
            return callback(err, null, response);
        }

        var cssPropertyValue = response.elementIdCssProperty,
            parsedValue = {
                property: cssProperty,
                value: cssPropertyValue.value.toLowerCase().trim()
            };

        if(parsedValue.value.indexOf('rgb') === 0) {

            // parse color values
            var color = parsedValue.value;
            parsedValue.parsed = rgb2hex(parsedValue.value);
            parsedValue.parsed.type = 'color';
            parsedValue.parsed[/[rgba]+/g.exec(color)[0]] = color;

        } else {

            // parse other css properties
            try {
                parsedValue.parsed = parse(cssPropertyValue.value);

                if(parsedValue.parsed.length === 1) {
                    parsedValue.parsed = parsedValue.parsed[0];
                }

                if(parsedValue.parsed.type && parsedValue.parsed.type === 'number' && parsedValue.parsed.unit === '') {
                    parsedValue.value = parsedValue.parsed.value;
                }

            } catch(e) {
                // TODO improve css-parse lib to handle properties like
                // `-webkit-animation-timing-function :  cubic-bezier(0.25, 0.1, 0.25, 1)
            }

        }

        callback(err, parsedValue || null, response);

    });

};

