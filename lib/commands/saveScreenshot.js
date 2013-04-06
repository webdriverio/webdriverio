exports.command = function (fileName, callback) {

    var self = this;

    this.screenshot(function(err,result) {
        if(err === null) {

            self.writeFile(fileName, result.value);
            if (typeof callback === "function") {
                callback(err,result);
            }

        } else {

            if (typeof callback === "function") {
                callback(err,result);
            }

        }

    });
};

