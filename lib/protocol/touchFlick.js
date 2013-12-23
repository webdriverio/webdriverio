/**
 * Flick on the touch screen using finger motion events. If element ID is given
 * the action starts at a particulat screen location.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/flick
 *
 * parametrization if all  four arguments are given:
 * @param {String} id      of the element where the flick starts
 * @param {Number} x       offset in pixels to flick by
 * @param {Number} y       offset in pixels to flick by
 * @param {Number} speed   in pixels per seconds
 *
 * parametrization if only three arguments are given:
 * @param {Number} xspeed  in pixels per second
 * @param {Number} yspeed  in pixels per second
 * 
 */

module.exports = function touchFlick (id, xoffset, yoffset, speed, callback) {

    var data = {},
        requestOptions = {
            path: '/session/:sessionId/touch/flick',
            method: 'POST'
        };

    if(arguments.length === 5 && typeof xoffset === 'number' && typeof yoffset === 'number' && typeof speed === 'number' && typeof callback === 'function') {

        data.element = id.toString();
        data.xoffset = offset.xoffset;
        data.yoffset = offset.yoffset;
        data.speed   = speed;

    } else if(arguments.length === 3 && typeof id === 'number' && typeof xoffset === 'number' && typeof yoffset === 'function') {

        data.xspeed = id.toString();
        data.yspeed = xoffset;
        callback    = yoffset;

    } else {
        throw 'number or type of arguments don\'t agree with touchFlick command';
    }

    this.requestHandler.create(requestOptions,data,callback);

};