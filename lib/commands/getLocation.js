exports.command = function(cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err, result) {
        if(err === null && result.value !== undefined) {

            self.elementIdLocation(result.value.ELEMENT, function(err, result) {
                if (err === null && typeof callback === "function" && result !== undefined) {
                    callback(err, {x:result.value.x, y: result.value.y});
                } else {
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

