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
 * @param {Boolean=} includeSelectorTag if true it includes the tag of selector element (default: true)
 *
 * @uses protocol/execute
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
            self.execute(getHTMLHelper, selector, includeSelectorTag, cb);
        },
        function(res, cb) {
            response.execute = res;
            cb();
        }
    ], function(err) {

        // throw NoSuchElement error if no element was found
        if (!response.execute || !response.execute.value) {
            err = new ErrorHandler(7);
        }

        var value = response.execute.value.length === 1 ? response.execute.value[0] : response.execute.value;

        callback(err, value, response);

    });

};