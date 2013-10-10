exports.command = function(url, windowName, windowFeatures, callback) {

    var self = this,
        allErrors = [];

    if(typeof windowName === 'function') {
        callback = windowName;
        windowName = '';
        windowFeatures = '';
    } else if(typeof windowFeatures === 'function') {
        callback = windowFeatures;
        windowFeatures = '';
    }

    this.execute('window.open(arguments[0], arguments[1], arguments[2]);',[url, windowName, windowFeatures], function(err,res) {

        if(err === null) {

            // switch focus to new window
            self.getTabIds(function(err,res) {

                if(err === null && res) {

                    self.tabs = res;
                    self.switchTab(res[res.length-1], function(err,res) {

                        if(err === null && callback === 'function') {

                            callback(err,res);

                        } else if(typeof callback === 'function') {

                            callback(err);

                        }

                    });

                } else if(typeof callback === 'function') {

                    callback(err);

                }

            });

        } else if(typeof callback === 'function') {

            callback(err);

        }

    });

};
