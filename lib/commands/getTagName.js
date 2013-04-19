exports.command = function(cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err,result) {
        if(err === null) {

            self.elementIdName(result.value.ELEMENT, function(err,result) {
                if (typeof callback === "function") {
                    callback(err,result.value.toLowerCase());
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err,result);
            }

        }

    });
};

