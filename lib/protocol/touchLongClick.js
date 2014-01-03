/**
 * Long press on the touch screen using finger motion events.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/longclick
 *
 * @param {String} id  of the element to long press on
 */

module.exports = function touchLongClick (id, callback) {

    var data = { element: id.toString() },
        requestOptions = {
            path: '/session/:sessionId/touch/longclick',
            method: 'POST'
        };

    this.requestHandler.create(requestOptions,data,callback);

};