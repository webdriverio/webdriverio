module.exports = function newWindow (url, windowName, windowFeatures, callback) {

    var self = this,
        script = 'window.open(arguments[0], arguments[1], arguments[2]);';
        allErrors = [];

    if(typeof windowName === 'function') {
        callback = windowName;
        windowName = '';
        windowFeatures = '';
    } else if(typeof windowFeatures === 'function') {
        callback = windowFeatures;
        windowFeatures = '';
    }

    this.execute(script,[url, windowName, windowFeatures], function(err) {
        if (err !== null) {
            return callback(err);
        }

        // switch focus to new window
        self.getTabIds(function(err,res) {
            if (err !== null) {
                return callback(err);
            }

            self.switchTab(res[res.length-1], callback);
        });

    });

};
