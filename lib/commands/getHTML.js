/* global document */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getHTML (selector, includeSelectorTag) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getHTML command'));
    }
    if(typeof includeSelectorTag !== 'boolean') {
        includeSelectorTag = true;
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            /* istanbul ignore next */
            self.execute(function(selector,includeSelectorTag) {

                var elem = document.querySelector(selector);

                if(!elem) {
                    return null;
                }

                return elem[includeSelectorTag ? 'outerHTML' : 'innerHTML'];

            }, [selector,includeSelectorTag], cb);
        },
        function(res, cb) {
            response.execute = res;
            cb();
        }
    ], function(err) {

        if(!response.execute.value) {
            err = new ErrorHandler.CommandError('element with selector \'' + selector + '\' couldn\'t be found on the page');
        }

        callback(err, response.execute.value, response);

    });

};