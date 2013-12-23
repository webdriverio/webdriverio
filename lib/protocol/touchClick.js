/**
 * Single tap on the touch enabled device.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/click
 *
 * @param {String} id  of the session to route the command to
 */

module.exports = function touchClick (id, callback) {

    if(arguments.length !== 2 || typeof callback !== 'function') {
        throw 'number or type of arguments don\'t agree with touchClick command';
    }

    var data = { element: id.toString() },
        requestOptions = {
            path: '/session/:sessionId/touch/click',
            method: 'POST'
        };

    this.requestHandler.create(requestOptions,data,callback);

};