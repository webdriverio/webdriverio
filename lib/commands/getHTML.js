/**
 *
 * Get source code of specified DOM element by selector.
 *
 * <example>
    :index.html
    <div id="test">
        <span>Lorem ipsum dolor amet</span>
    </div>

    :getHTML.js
    client
        .getHTML('#test', function(err, html) {
            console.log(html);
            // outputs the following:
            // "<div id="test"><span>Lorem ipsum dolor amet</span></div>"
        })
        .getHTML('#test', false, function(err, html) {
            console.log(html);
            // outputs the following:
            // "<span>Lorem ipsum dolor amet</span>"
        });
 * </example>
 *
 * @param {String}   selector           element to get the current DOM structure from
 * @param {Boolean=} includeSelectorTag if true it includes the selector element tag (default: true)
 *
 * @uses action/selectorExecute
 * @type property
 *
 */

var async = require('async'),
    getHTMLHelper = require('../helpers/_getHTML'),
    ErrorHandler = require('../utils/ErrorHandler');

module.exports = function getHTML(selector, includeSelectorTag) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getHTML command'));
    }
    if (typeof includeSelectorTag !== 'boolean') {
        includeSelectorTag = true;
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.selectorExecute(selector, getHTMLHelper, includeSelectorTag, cb);
        },
        function(res, response, cb) {
            response.selectorExecute = response;
            cb(null, res);
        }
    ], function(err, html) {

        // throw NoSuchElement error if no element was found
        if (!html) {
            err = new ErrorHandler(7);
        }

        var value = html && html.length === 1 ? html[0] : html;

        callback(err, value, response);

    });

};