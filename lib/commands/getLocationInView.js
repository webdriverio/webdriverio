exports.command = function(cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err, result) {
        
        if(err === null && result.value) {

            self.elementIdLocationInView(result.value.ELEMENT, function(err, result) {
                if (typeof callback === "function") {
                    callback(err, {
                        x: parseInt(result.value.x,10),
                        y: parseInt(result.value.y,10)
                    });
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err, result);
            }

        }
    });
};

