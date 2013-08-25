exports.command = function (cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err, result) {
        
        if(err === null && result.value) {

            self.submit(result.value.ELEMENT, function(err, result) {
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

