/**
 *
 * Drag an item to a destination element.
 *
 * @param {String} sourceElem      source selector
 * @param {String} destinationElem destination selector
 *
 * @uses action/moveToObject, protocol/buttonDown, protocol/buttonUp, property/getLocation, protocol/touchDown, protocol/touchMove, protocol/touchUp
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function dragAndDrop (sourceElem, destinationElem) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof sourceElem !== 'string' || typeof destinationElem !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with dragAndDrop command'));
    }

    var self     = this,
        response = {};

    if(!this.isMobile) {

        async.waterfall([
            function(cb) {
                self.moveToObject(sourceElem, cb);
            },
            function(val, res, cb) {
                response.moveToSourceObject = res;
                self.buttonDown(cb);
            },
            function(res, cb) {
                response.buttonDown = res;
                self.moveToObject(destinationElem, cb);
            },
            function(val, res, cb) {
                response.moveToDestObject = res;
                self.buttonUp(cb);
            },
            function(res, cb) {
                response.buttonUp = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    } else {

        async.waterfall([
            function(cb) {
                self.getLocation(destinationElem, cb);
            },
            function(val, res, cb) {
                response.getDestLocation = res;
                self.getLocation(sourceElem, cb);
            },
            function(val, res, cb) {
                response.getSourceLocation = res;
                self.touchDown(val.x, val.y, cb);
            },
            function(res, cb) {
                response.touchDown = res;
                self.touchMove(response.getDestLocation.x, response.getDestLocation.y, cb);
            },
            function(res, cb) {
                response.touchMove = res;
                self.touchUp(response.getDestLocation.x, response.getDestLocation.y, cb);
            },
            function(res, cb) {
                response.touchUp = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};
