exports.command = function(cssSelector, attributeName, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err,result) {

        if(err === null && result.value) {

            self.elementIdAttribute(result.value.ELEMENT, attributeName, function(err,result) {
                if (typeof callback === "function") {
                    callback(err,result.value);
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err,result);
            }

        }
    });
};

