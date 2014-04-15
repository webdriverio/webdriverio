module.exports = function tap (selector, x, y, tapCount, touchCount, duration, callback) {

    if(arguments.length === 2 && typeof x === 'function') {
        callback = x;
        x = null;
    } else if(arguments.length === 3 && typeof y === 'function') {
        callback = y;
        y = null;
    } else if(arguments.length === 4 && typeof tapCount === 'function') {
        callback = tapCount;
        tapCount = null;
    } else if(arguments.length === 5 && typeof touchCount === 'function') {
        callback = touchCount;
        touchCount = null;
    } else if(arguments.length === 6 && typeof duration === 'function') {
        callback = duration;
        duration = null;
    }

    if(typeof selector === 'string' && selector !== '') {

        this.element(selector, function(err,res) {

            if(err === null && res.value) {

                if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

                    this.elementIdLocation(res.value.ELEMENT, function(errLocation,location) {
                        this.elementIdSize(res.value.ELEMENT, function(errSize,size) {

                            location = location.value;
                            size     = size.value;

                            if(!errLocation && !errSize) {

                                this.scroll(0, location.y - 100)
                                    .touchTap(tapCount, touchCount, duration, location.x + (size.width / 2), 100 + (size.height / 2), null, callback)
                                    .pause(250);

                            } else {

                                if(typeof callback === 'function') {
                                    /* istanbul ignore next */
                                    callback([errLocation,errSize]);
                                }

                            }

                        });
                    });

                } else {

                    this.touchTap(tapCount, touchCount, duration, x, y, res.value.ELEMENT, callback);

                }

            } else {

                if(typeof callback === 'function') {
                    /* istanbul ignore next */
                    callback(err,res);
                }

            }

        });

    } else {

        this.touchTap(tapCount, touchCount, duration, x, y, null, callback);

    }

};

