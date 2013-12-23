/**
 * Scroll on the touch screen using finger based motion events. If
 * element ID is given start scrolling at a particular screen location.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/scroll
 *
 * @optional {String} id       the element where the scroll starts.
 * @param    {Number} xoffset  in pixels to scroll by
 * @param    {Number} yoffset  in pixels to scroll by
 */

module.exports = function touchScroll (id, xoffset, yoffset, callback) {

    var data = {};

    // check passed arguments
    if(arguments.length === 4 && typeof xoffset === 'number' && typeof yoffset === 'number' && typeof callback === 'function') {

        data.element = id.toString();
        data.xoffset = xoffset;
        data.yoffset = yoffset;

    } else if (arguments.length === 3 && typeof id === 'number' && typeof xoffset === 'number' && typeof yoffset === 'function') {

        // redefine arguments
        data.xoffset = id.toString();
        data.yoffset = xoffset;
        callback     = yoffset;

    } else {
        throw 'number or type of arguments don\'t agree with touchScroll command';
    }

    var requestOptions = {
        path: '/session/:sessionId/touch/scroll',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions,data,callback);

};