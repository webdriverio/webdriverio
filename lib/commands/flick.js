module.exports = function flick (selector, startX, startY, endX, endY, touchCount, callback) {

    var xOffset  = 0,
        yOffset  = 0,
        isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(startX && endX) {
        xOffset = Math.abs(startX - endX);
        yOffset = Math.abs(startY - endY);
    }

    if(!isMobile) {
        return typeof callback === 'function' ? callback(new Error('flick command is not supported on non mobile platforms')) : false;
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
                                    
                                    // flick gesture on web element with given selector
                                    this.touchFlickPrecise(touchCount, startX, startY, endX, endY, null, callback);

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

                    // flick gesture on native element with given selector
                    this.touchFlickPrecise(touchCount, startX, startY, endX, endY, res.value.ELEMENT, callback);

                }

            } else {

                /* istanbul ignore next */
                callback(err, res);

            }

        });

    } else {

        if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

            this.touchFlick(null, xOffset, yOffset, 1, callback);

        } else {

            this.touchFlickPrecise(touchCount, startX, startY, endX, endY, null, callback);

        }

    }

};

