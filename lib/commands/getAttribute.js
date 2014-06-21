/**
 *
 * Get an attribute from an DOM-element based on the selector and attribute name.
 * Returns a list of attribute values if selector matches multiple elements.
 *
 * <example>
    :index.html
    <div data-type="example" id="elem">
        Lorem ipsum dolor ammet
    </div>

    :getAttribute.js
    client.getAttribute('#elem', 'data-type', function(err, attr) {
        console.log(attr); // outputs: "example"
    }).call(done);
 * </example>
 *
 * @param {String} selector      element with requested attribute
 * @param {String} attributeName requested attribute
 *
 * @returns {String|String[]|null} The value of the attribute(s), or null if it is not set on the element.
 *
 * @uses protocol/elements, protocol/elementIdAttribute
 * @type property
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getAttribute (selector, attributeName) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string' || typeof attributeName !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getAttribute command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdAttribute = [];

            if(res.value.length === 0) {
                // throw NoSuchElement error if no element was found
                return callback(new ErrorHandler(7));
            }

            async.eachSeries(res.value || [], function(val, seriesCallback) {
                self.elementIdAttribute(val.ELEMENT, attributeName, function(err,res) {
                    response.elementIdAttribute.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdAttribute && response.elementIdAttribute.length === 1) {

            value = response.elementIdAttribute[0].value;

            if(value) {
                value = value.trim();
            }

        } else if(response.elementIdAttribute && response.elementIdAttribute.length > 1) {

            value = response.elementIdAttribute.map(function(res) {

                if(res.value) {
                    res.value = res.value.trim();
                }

                return res.value;
            });

        }

        callback(err, value, response);

    });

};

