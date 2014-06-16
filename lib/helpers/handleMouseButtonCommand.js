var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

// call must be scoped to the webdriverjs client
module.exports = function(selector, button) {

    var self = this,
        response = {};

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if (typeof selector === 'function') {
        callback = selector;
        selector = undefined;
    }

    if(this.isMobile && !selector) {
        return callback(new ErrorHandler.ProtocolError('the leftClick/middleClick/rightClick command requires an element to click on'));
    }

    if ((button === 'left' && selector) || this.isMobile) {
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