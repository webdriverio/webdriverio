/**
 *
 * Drag an item to a destination element.
 *
 * @param {String} sourceElem      source selector
 * @param {String} destinationElem destination selector
 * @callbackParameter error
 *
 * @uses action/moveToObject, protocol/buttonDown, protocol/buttonUp, property/getLocation, protocol/touchDown, protocol/touchMove, protocol/touchUp
 * @type action
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function dragAndDrop (sourceElem, destinationElem) {

    /*!
     * parameter check
     */
    if(typeof sourceElem !== 'string' || typeof destinationElem !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with dragAndDrop command');
    }

    if(this.isMobile) {
        return this.getLocation(sourceElem).then(function(location) {
            return this.touchDown(location.x, location.y);
        }).getLocation(destinationElem).then(function(location) {
            return this.touchMove(location.x, location.y).touchUp(location.x, location.y);
        });
    }

    return this.moveToObject(sourceElem).buttonDown().moveToObject(destinationElem).buttonUp();

};
