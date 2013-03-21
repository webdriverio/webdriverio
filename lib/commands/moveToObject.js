exports.command = function (cssSelector, callback) {

    var self = this;

    this.element("css selector", cssSelector,function (result) {
        if(result.status === 0) {

            self.moveTo(result.value.ELEMENT,function (result) {
                if (typeof callback === "function") {
                    callback();
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(result);
            }

        }
    });
};

