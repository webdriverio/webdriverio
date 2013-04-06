exports.command = function(callback) {
    this.title(function(err, result) {

        if(err === null) {

            if (typeof callback === "function") {
                callback(err, result.value);
            }

        } else {

            if (typeof callback === "function") {
                callback(err, result);
            }

        }
    });
};

