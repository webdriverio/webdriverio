exports.command = function(callback) {

    var self = this;
    this.sessions(function(err,result) {

        if (!err && result.value) {

            result.value.forEach(function(session) {
                self.session('delete', session.id);
            });
            self.call(callback);
        }
        else {
            if(typeof callback === "function") {
                callback(err, result);
            }
        }




    });

};
