module.exports = function dragAndDrop (cssSelectorItem, cssSelectorDropDestination, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {

        this.moveToObject(cssSelectorItem)
            .buttonDown()
            .moveToObject(cssSelectorDropDestination)
            .buttonUp(callback);

    } else {

        this.getLocation(cssSelectorItem,function(err,res) {

            if(err === null && res) {

                this.touchDown(res.x,res.y)
                    .getLocation(cssSelectorDropDestination,function(err,res) {

                        if(err === null && res) {

                            this.touchMove(res.x,res.y)
                                .touchUp(res.x,res.y,callback);

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

    }

};
