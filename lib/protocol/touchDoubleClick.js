/**
 * Double tap on the touch screen using finger motion events.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/doubleclick
 *
 * @param {String} id  of the session to route the command to
 */

module.exports = function touchDoubleClick (id, callback) {

    if(arguments.length !== 2 || typeof callback !== 'function') {
        throw 'number or type of arguments don\'t agree with touchDoubleClick command';
    }

    var data = { element: id.toString() },
        requestOptions = {
            path: '/session/:sessionId/touch/doubleclick',
            method: 'POST'
        };

    this.requestHandler.create(requestOptions,data,callback);

};