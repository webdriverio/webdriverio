module.exports = function swipe (selector, startX, startY, endX, endY, touchCount, duration, callback) {

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

                    this.elementIdLocation(result.value.ELEMENT, function(err,res) {

                        if(err !== null && res) {

                            this.touchDown(result.value.x,result.value.y)
                                .touchMove(endX,endY)
                                .touchUp(endX,endY);

                        } else {

                            callback(err,res);

                        }

                    });

                } else {

                    this.touchSwipe(touchCount, startX, startY, endX, endY, duration, res.value.ELEMENT, callback);

                }

            } else {

                callback(err, res);

            }

        });

    } else {

        if(this.desiredCapabilities.browserName) {

            this.touchDown(startX,startY)
                .touchMove(endX,endY)
                .touchUp(endX,endY,callback);

        } else {

            this.touchSwipe(touchCount, startX, startY, endX, endY, duration, null, callback);

        }

    }

};

