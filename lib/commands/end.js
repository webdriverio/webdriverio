exports.command = function(callback) {

    this.session("delete", function(err,result) {

        if(typeof callback === "function") {
            callback(err,result);
        }

    });
};