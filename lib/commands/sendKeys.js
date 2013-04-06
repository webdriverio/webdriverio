exports.command = function (cssSelector, keys, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err, result) {
        if(err === null) {

            self.elementIdKeys(result.value.ELEMENT, keys, function(err, result) {
                if (typeof callback === "function") {
                    callback(err, result);
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err, result);
            }

        }
    });
};

