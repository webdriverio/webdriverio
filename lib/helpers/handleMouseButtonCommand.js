// call must be scoped to the webdriverjs client
module.exports = function(cssSelector, button, callback) {

    var self = this;

    if(typeof cssSelector === 'function') {
        callback = cssSelector;
        cssSelector = undefined;
    }
    callback = callback || function() {};

    if(button === 'left' && cssSelector) {
        self.click(cssSelector, callback);
    } else if(! cssSelector) {
        self.buttonPress(button, callback);
    } else {

        self.element(cssSelector, function(err,result) {

            if(err === null && result.value) {

                self.moveTo(result.value.ELEMENT, function(err,result){

                    if(err === null) {
                        self.buttonPress(button, callback);
                    } else {
                        callback(err, result);
                    }

                });

            } else {

                /* istanbul ignore next */
                callback(err,result);

            }
        });

    }

};