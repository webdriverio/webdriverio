exports.command = function(using, value, callback) {

    var self = this;

    this.element(using, value, function(result) {
        if(result.status === 0) {

            self.elementIdSize(result.value.ELEMENT, function(result) {
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

