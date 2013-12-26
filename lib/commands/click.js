var clickHelper = require('../helpers/click');

module.exports = function click (cssSelector, button, callback) {

    var self = this;

    if(typeof callback !== 'function' && typeof button === 'function') {
        callback = button;
        button = undefined;
    }

    this.element("css selector", cssSelector, function(err,result) {

        if(err === null && result.value) {

            if(button != undefined) {
                self.moveTo(result.value.ELEMENT, function(err,result){

                    if(err === null) {
                        self.buttonPress(button, callback);
                    } else {
                        callback(err, result);
                    }

                });
            } else {
                self.elementIdClick(result.value.ELEMENT, function(err,result) {

                    if(err && err.status === 13 && result && result.value && result.value.message && result.value.message.indexOf('Element is not clickable at point') !== -1) {

                        // if an element can't be clicked, execute the helper function
                        self.execute(clickHelper(cssSelector),[],callback);

                    } else {
                        callback(err,result);
                    }
                });
            }

        } else {

            callback(err,result);

        }
    });

};

