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

    var xOffset  = 0,
        yOffset  = 0,
        isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(startX && endX) {
        xOffset = Math.abs(startX - endX);
        yOffset = Math.abs(startY - endY);
    }

    if(!isMobile) {
        throw 'swipe command is not supported on non mobile platforms';
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

