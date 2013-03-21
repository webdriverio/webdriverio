exports.command = function(cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(result) {
        if(result.status === 0 && result.value !== undefined) {

            self.elementIdLocation(result.value.ELEMENT, function(result) {
                if (typeof callback === "function" && result !== undefined) {
                    callback({x:result.value.x, y: result.value.y});
                } else {
                    callback(result);
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(result);
            }

        }
    });
};

