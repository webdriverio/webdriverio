exports.command = function(newTabID, callback) {

    var self = this;
    this.window(function(err, result) {

        if(err === null) {

            if(typeof newTabID === 'function' || (typeof newTabID === 'string' && newTabID === '')) {

                callback = typeof newTabID === 'function' ? newTabID : callback;

                if (typeof callback === "function") {
                    callback(err, result.value);
                }

            } else {

                this.switchTab(newTabID,function(err,result) {

                    if (typeof callback === "function") {
                        callback(err, result);
                    }

                });

            }

        } else {

            if (typeof callback === "function") {
                callback(err, result);
            }

        }
    });
};