exports.command = function (cssSelector, value, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err, result) {
        
        if(err === null && result.value) {

            self.elementIdValue(result.value.ELEMENT, value, function(err, result) {
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