/**
 * Double tap on the touch screen using finger motion events.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/doubleclick
 *
 * @param {String} id  of the session to route the command to
 */

module.exports = function touchDoubleClick (id, callback) {

    this.requestHandler.create(
      '/session/:sessionId/touch/doubleclick',
      { element: id.toString() },
      callback
    );

};