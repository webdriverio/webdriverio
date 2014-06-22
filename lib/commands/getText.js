/**
 *
 * Get the text content from a DOM-element found by given selector.
 *
 * <example>
    :index.html
    <div id="elem">
        Lorem ipsum <strong>dolor</strong> sit amet,<br>
        consetetur sadipscing elitr
    </div>

    :getText.js
    client.getText('#elem', function(err, text) {
        console.log(text);
        // outputs the following:
        // "Lorem ipsum dolor sit amet,consetetur sadipscing elitr"
    });
 * </example>
 *
 * @param   {String}           selector   element with requested text
 * @returns {String|String[]}             content of selected element (all HTML tags are removed)
 *
 * @uses protocol/elements, protocol/elementIdText
 * @type property
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getText (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getText command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdText = [];

            if(res.value.length === 0) {
                // throw NoSuchElement error if no element was found
                return callback(new ErrorHandler(7));
            }

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdText(val.ELEMENT, function(err,res) {
                    response.elementIdText.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdText && response.elementIdText.length === 1) {

            value = response.elementIdText[0].value;

        } else if(response.elementIdText && response.elementIdText.length > 1) {

            value = response.elementIdText.map(function(res) {
                return res.value;
            });

        }

        callback(err, value, response);

    });

};