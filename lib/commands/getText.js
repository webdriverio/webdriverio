exports.command = function(cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(result) {
        if(result.status === 0) {

            self.elementIdText(result.value.ELEMENT, function(result) {
                if (typeof callback === "function") {
                    callback(result.value);
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(result);
            }

        }
    });
};

