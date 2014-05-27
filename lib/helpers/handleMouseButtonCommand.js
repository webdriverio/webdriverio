var async = require('async');

// call must be scoped to the webdriverjs client
module.exports = function(selector, button, callback) {

    var self = this;

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if (typeof selector === 'function') {
        callback = selector;
        selector = undefined;
    }

    if (button === 'left' && selector) {
        self.click(selector, callback);
    } else if (!selector) {
        self.buttonPress(button, callback);
    } else {

        async.waterfall([

            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;
                self.moveTo(res.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.moveTo = res;
                self.buttonPress(button, cb);
            },
            function(res, cb) {
                response.buttonPress = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};