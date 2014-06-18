/**
 *
 * get DOM of specified selector
 *
 * @param {String}  selector           element to get the current DOM structure from
 * @param {Boolean} includeSelectorTag if true it includes the tag of selector element
 *
 * @uses protocol/execute
 *
 */

/* global document */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

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
            /* istanbul ignore next */
            self.execute(function(selector, includeSelectorTag) {

                var elements = document.querySelectorAll(selector),
                    ret = [];

                if (elements.length === 0) {
                    return null;
                }

                for (var i = 0; i < elements.length; ++i) {
                    ret.push(elements[i][includeSelectorTag ? 'outerHTML' : 'innerHTML']);
                }

                return ret;

            }, selector, includeSelectorTag, cb);
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