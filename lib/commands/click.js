var clickHelper = require('../helpers/click');

module.exports = function click (selector, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);
    
    if(!isMobile) {

        this.element(selector, function(err,result) {

            if(err === null && result.value) {

                this.elementIdClick(result.value.ELEMENT, function(err,result) {

                    if(err && err.status === 13 && result && result.value && result.value.message && result.value.message.indexOf('Element is not clickable at point') !== -1) {

                        // if an element can't be clicked, execute the helper function
                        this.execute(clickHelper(selector),[],callback);

                    } else {

                        /* istanbul ignore next */
                        callback(err,result);

                    }
                });

            } else {

                /* istanbul ignore next */
                callback(err,result);

            }
        });

    } else {

        this.tap(selector,callback);

    }

};

