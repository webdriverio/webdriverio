/**
 *
 * Get a css property from a DOM-element selected with a css selector. The return value
 * is formatted to be testable. Colors gets parsed via [rgb2hex](https://www.npmjs.org/package/rgb2hex)
 * and all other properties gets parsed via [css-value](https://www.npmjs.org/package/css-value).
 *
 * ### Usage
 *
 *     client.getCssProperty('#someElement', 'color', function(err,res) {
 *         console.log(res);
 *
 *         /**
 *          * will output the following:
 *          *
 *          * {
 *          *     property: 'color',
 *          *     value: 'rgba(0, 136, 204, 1)',
 *          *     parsed: {
 *          *         hex: '#0088cc',
 *          *         alpha: 1,
 *          *         type: 'color',
 *          *         rgba: 'rgba(0, 136, 204, 1)'
 *          *     }
 *          * }
 *          *\/
 *
 *     });
 *
 *     client.getCssProperty('#someElement', 'width', function(err,res) {
 *         console.log(res);
 *
 *         /**
 *          * will output the following:
 *          *
 *          * {
 *          *     property: 'width',
 *          *     value: '100px',
 *          *     parsed: {
 *          *         type: 'number',
 *          *         string: '100px',
 *          *         unit: 'px',
 *          *         value: 100
 *          *     }
 *          * }
 *          *\/
 *     });
 *
 * @param {String} selector    element with requested style attribute
 * @param {String} cssProperty css property name
 *
 * @uses protocol/elements, protocol/elementIdCssProperty
 *
 */

var async = require('async'),
    parseCSS = require('../helpers/parseCSS.js'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getCssProperty (selector, cssProperty) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
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

