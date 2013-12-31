// call must be scoped to the webdriverjs client
module.exports = function(cssSelector, button, callback) {

    var self = this;

    callback = callback || function() {};

    this.element("css selector", cssSelector, function(err,result) {

        if(err === null && result.value) {

            self.moveTo(result.value.ELEMENT, function(err,result){

                if(err === null) {
                    self.buttonPress(button, callback);
                } else {
                    callback(err, result);
                }

            });

        } else {

            callback(err,result);

        }
    });

};