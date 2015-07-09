/**
 *
 * Send a sequence of key strokes to an element (clears value before). You can also use
 * unicode characters like Left arrow or Back space. WebdriverIO will take care of
 * translating them into unicode characters. You’ll find all supported characters
 * [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value).
 * To do that, the value has to correspond to a key from the table.
 *
 * <example>
    :setValue.js
    client
        .setValue('.input', 'test123')
        .getValue('.input').then(function(value) {
            assert(value === 'test123'); // true
        });
 * </example>
 *
 * @param {String}         selector   Input element
 * @param {String|Number=} values     Input element
 *
 * @uses protocol/elements, protocol/elementIdClear, protocol/elementIdValue
 * @type action
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setValue (selector, value) {

    /*!
     * parameter check
     */
    if(typeof value === 'number') {
        value = value.toString();
    }

    if(typeof value !== 'string' && !Array.isArray(value)) {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with setValue command');
    }

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdValueCommands = [];

        res.value.forEach(function(elem) {
            elementIdValueCommands.push(self.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value));
        });

        return this.unify(elementIdValueCommands, {
            extractValue: true
        });

    });

};
