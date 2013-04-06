exports.command = function(cssSelector, callback) {
    var self = this;

    this.moveToObject(cssSelector);
    this.element("css selector", cssSelector, function(err,result) {

        if(err === null) {

            self.doDoubleClick(function(err,result) {
                if (typeof callback === "function") {
                    callback(err,result);
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err,result);
            }

        }

    });
};

