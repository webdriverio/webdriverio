/**
 *
 * Move the mouse by an offset of the specificed element. If no element is specified,
 * the move is relative to the current mouse cursor. If an element is provided but no
 * offset, the mouse will be moved to the center of the element. If the element is not
 * visible, it will be scrolled into view.
 *
 * @param {String} selector element to move to
 * @uses protocol/element, protocol/elementIdLocation
 *
 */

var async = require('async'),
    isMobileHelper = require('../helpers/isMobile'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function moveToObject (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
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