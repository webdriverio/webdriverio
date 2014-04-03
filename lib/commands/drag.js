module.exports = function swipe (selector, startX, startY, endX, endY, touchCount, duration, callback) {

    var xOffset  = 0,
        yOffset  = 0,
        isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(startX && endX) {
        xOffset = Math.abs(startX - endX);
        yOffset = Math.abs(startY - endY);
    }

    if(!isMobile) {
        return typeof callback === 'function' ? callback(new Error('swipe command is not supported on non mobile platforms')) : false;
    }

    if(typeof selector === 'string') {

        this.element(selector, function(err,res) {

            if(err === null && res.value) {

                if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

                    this.elementIdLocation(res.value.ELEMENT, function(err,location) {
                        location = location.value;

                        if(err === null && location) {

                            this.elementIdSize(res.value.ELEMENT, function(err,size) {
                                size = size.value;

                                if(err === null && size) {

                                    startX = startX <= 1 ? location.x + (startX * size.width ) : startX;
                                    startY = startY <= 1 ? location.y + (startY * size.height) : startY;
                                    endX   = endX   <= 1 ? location.x + (endX   * size.width ) : endX;
                                    endY   = endY   <= 1 ? location.y + (endY   * size.height) : endY;
                                    
                                    // swipe gesture on web element with given selector
                                    this.touchSwipe(touchCount, startX, startY, endX, endY, duration, null, callback);

                                } else {

                                    /* istanbul ignore next */
                                    callback(err,res);

                                }

                            });

                        } else {

                            /* istanbul ignore next */
                            callback(err,res);

                        }

                    });

                } else {

                    // swipe gesture on native element with given selector
                    this.touchSwipe(touchCount, startX, startY, endX, endY, duration, res.value.ELEMENT, callback);

                }

            } else {

                /* istanbul ignore next */
                callback(err, res);

            }

        });

    } else {

        // swipe gesture on native or web element without given selector
        this.touchSwipe(touchCount, startX, startY, endX, endY, duration, null, callback);

    }

};

