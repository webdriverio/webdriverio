/**
 *
 * Move the mouse by an offset of the specificed element. If no element is specified,
 * the move is relative to the current mouse cursor. If an element is provided but no
 * offset, the mouse will be moved to the center of the element. If the element is not
 * visible, it will be scrolled into view.
 *
 * @param {String} selector element to move to
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @uses protocol/element, protocol/elementIdLocation
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function moveToObject(selector, xoffset, yoffset) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with moveToObject command'));
    }

    /**
     * check for offset params
     */
    var hasOffsetParams = true;
    if (typeof xoffset !== 'number' && typeof yoffset !== 'number') {
        hasOffsetParams = false;
    }

    if (typeof xoffset !== 'number') {
        xoffset = 0;
    }

    if (typeof yoffset !== 'number') {
        yoffset = 0;
    }

    var self = this,
        response = {};

    if (this.isMobile) {

        async.waterfall([

            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;
                self.elementIdSize(res.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.elementIdSize = res;
                self.elementIdLocation(response.element.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.elementIdLocation = res;

                var x = res.value.x,
                    y = res.value.y;

                if(hasOffsetParams) {
                    x = res.value.x - (response.elementIdSize.value.width / 2) + xoffset;
                    y = res.value.y - (response.elementIdSize.value.height / 2) + yoffset;
                }

                self.touchMove(x, y, cb);
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
                self.moveTo(res.value.ELEMENT, xoffset, yoffset, cb);
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