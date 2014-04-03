module.exports = function moveToObject (cssSelector, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    this.element(cssSelector,function(err,result) {
        if(err === null && result.value) {

            if(!isMobile) {

                this.moveTo(result.value.ELEMENT,callback);

            } else {

                this.elementIdLocation(result.value.ELEMENT, function(err,res) {

                    if(err !== null && res) {

                        this.touchMove(result.value.x,result.value.y,callback);

                    } else {

                        /* istanbul ignore next */
                        callback(err,res);

                    }

                });

            }

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

