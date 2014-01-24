/**
 * Long press on the touch screen using finger motion events.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/longclick
 *
 * @param {String} id  of the element to long press on
 */

module.exports = function touchLongClick (id, callback) {

    this.requestHandler.create(
        '/session/:sessionId/touch/longclick',
        { element: id.toString() },
        callback
    );

};