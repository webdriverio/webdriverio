exports.command = function(cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err, result) {
        if(err === null) {

            self.elementIdLocationInView(result.value.ELEMENT, function(err, result) {
                if (typeof callback === "function") {
                    callback(err, {x:result.value.x, y: result.value.y});
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err, result);
            }

        }
    });
};

