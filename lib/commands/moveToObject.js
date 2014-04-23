var async = require('async'),
    isMobileHelper = require('../helpers/isMobile'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function moveToObject (selector) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with moveToObject command'));
    }

    var isMobile = isMobileHelper(this.desiredCapabilities),
        self = this,
        response = {};

    if(isMobile) {

        async.waterfall([
            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;
                self.elementIdLocation(res.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.elementIdLocation = res;
                self.touchMove(res.value.x,res.value.y, cb);
            },
            function(res, cb) {
                response.touchMove = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

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
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};