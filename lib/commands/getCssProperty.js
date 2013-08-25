exports.command = function(cssSelector, cssProperty, callback) {

    var self = this;

    this.element("css selector", cssSelector, function(err, result) {
        
        if(err === null && result.value) {

            self.elementIdCssProperty(result.value.ELEMENT, cssProperty, function(err, result) {
                if (typeof callback === "function") {
                    callback(err, result.value.replace(/\s+/g, '').toLowerCase());
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err, result);
            }

        }
    });
};

