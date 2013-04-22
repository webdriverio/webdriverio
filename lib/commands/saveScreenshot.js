exports.command = function (fileName, callback) {

    var self = this;

    this.screenshot(function(err,result) {
        if(err === null) {

            self.writeFile(fileName, result.value, function(err) {
                if (typeof callback === "function") {
                    callback(err);
                }
            });

        } else {

            if (typeof callback === "function") {
                callback(err,result);
            }

        }

    });
};

