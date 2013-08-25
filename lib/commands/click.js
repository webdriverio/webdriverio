var clickHelper = require('../helpers/click');

exports.command = function(cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err,result) {

        if(err === null && result.value) {

            self.elementIdClick(result.value.ELEMENT, function(err,result) {

                if(err && err.status === 13 && result && result.value && result.value.message && result.value.message.indexOf('Element is not clickable at point') !== -1) {

                    // if an element can't be clicked, execute the helper function
                    self.execute(clickHelper(cssSelector),[],function(err,result) {

                        if (typeof callback === "function") {
                            callback(err,result);
                        }

                    });

                } else if (typeof callback === "function") {
                    callback(err,result);
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err,result);
            }

        }
    });

};

