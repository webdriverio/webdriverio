/**
 * flick command
 * 
 * @required endX, endY
 * 
 * possible argument structure:
 *
 * selector, startX, startY,     endX,       endY,       touchCount, callback
 * selector, startX, startY,     endX,       endY,       touchCount
 * selector, startX, startY,     endX,       endY,       callback
 * selector, startX, startY,     endX,       endY
 * 
 * selector, endX,   endY,       touchCount, callback
 * selector, endX,   endY,       touchCount
 * selector, endX,   endY,       callback
 * selector, endX,   endY
 * 
 * startX,   startY, endX,       endY,       touchCount, callback
 * startX,   startY, endX,       endY,       touchCount
 * startX,   startY, endX,       endY,       callback
 * startX,   startY, endX,       endY
 * 
 * endX,     endY,   touchCount, callback
 * endX,     endY,   callback
 * endX,     endY,   touchCount
 * endX,     endY
 */

var checkArgumentTypes = require('../helpers/checkArgumentTypes');

module.exports = function flick (selector, startX, startY, endX, endY, touchCount, callback) {

    var xOffset = 0,
        yOffset = 0;

    if(arguments.length === 6 && checkArgumentTypes(arguments,['string','number','number','number','number','function'])) {
        // func(selector, startX, startY, endX, endY, callback)
        callback   = touchCount;
        touchCount = null;
    } else if((arguments.length === 5 && checkArgumentTypes(arguments,['string','number','number','number','function'])) ||
              (arguments.length === 4 && checkArgumentTypes(arguments,['string','number','number','number']))) {
        // func(selector, endX, endY, touchCount, callback)
        // func(selector, endX, endY, touchCount)
        callback   = endY;
        touchCount = endX;
        endY       = startY;
        endX       = startX;
        startX     = null;
        startY     = null;
    } else if((arguments.length === 4 && checkArgumentTypes(arguments,['string','number','number','function'])) ||
              (arguments.length === 3 && checkArgumentTypes(arguments,['string','number','number']))) {
        // func(selector, endX, endY, callback)
        // func(selector, endX, endY)
        callback   = endX;
        endY       = startY;
        endX       = startX;
        startX     = null;
        startY     = null;
    } else if((arguments.length === 6 && checkArgumentTypes(arguments,['number','number','number','number','number','function'])) ||
              (arguments.length === 5 && checkArgumentTypes(arguments,['number','number','number','number','number']))) {
        // func(startX, startY, endX, endY, touchCount, callback)
        // func(startX, startY, endX, endY, touchCount)
        callback   = touchCount;
        endY       = endX;
        endX       = startY;
        startY     = startX;
        startX     = selector;
        touchCount = null;
        selector   = null;
    } else if((arguments.length === 5 && checkArgumentTypes(arguments,['number','number','number','number','function'])) ||
              (arguments.length === 4 && checkArgumentTypes(arguments,['number','number','number','number']))) {
        // func(startX, startY, endX, endY, callback)
        // func(startX, startY, endX, endY)
        callback   = endY;
        endY       = endX;
        endX       = startY;
        startY     = startX;
        startX     = selector;
        touchCount = null;
        selector   = null;
    } else if((arguments.length === 4 && checkArgumentTypes(arguments,['number','number','number','function'])) ||
              (arguments.length === 3 && checkArgumentTypes(arguments,['number','number','number']))) {
        // func(endX, endY, touchCount, callback)
        // func(endX, endY, callback)
        callback   = endX;
        touchCount = startY;
        endX       = selector;
        endY       = startX;
        startX     = null;
        startY     = null;
        selector   = null;
    } else if((arguments.length === 3 && checkArgumentTypes(arguments,['number','number','function'])) ||
              (arguments.length === 2 && checkArgumentTypes(arguments,['number','number']))) {
        // func(endX, endY, touchCount)
        // func(endX, endY)
        callback   = endX;
        endX       = startX;
        endY       = startY;
        touchCount = null;
        startX     = null;
        startY     = null;
        selector   = null;
    } else if(arguments.length !== 7) {
        throw 'number or type of arguments don\'t agree with flick command';
    }

    if(startX && endX) {
        xOffset = Math.abs(startX - endX);
        yOffset = Math.abs(startY - endY);
    }

    if(typeof selector === 'string') {

        this.element(selector, function(err,res) {

            if(err === null && res.value) {

                if(this.desiredCapabilities.browserName) {

                    this.touchFlick(res.value.ELEMENT, xOffset, yOffset, null, callback);

                } else {

                    this.touchFlickPrecise(touchCount, startX, startY, endX, endY, res.value.ELEMENT, callback);

                }

            }

        });

    } else {

        if(this.desiredCapabilities.browserName) {

            this.touchFlick(null, xOffset, yOffset, null, callback);

        } else {

            this.touchFlickPrecise(touchCount, startX, startY, endX, endY, null, callback);

        }

    }

};

