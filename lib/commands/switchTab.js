var async = require('async');

module.exports = function switchTab (tabID) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof tabID !== 'string') {
        tabID = null;
    }

    var self = this,
        response = {};

    if(tabID) {

        async.waterfall([
            function(cb) {
                self.window(tabID, cb);
            },
            function(res, cb) {
                response.window = res;
                cb();
            }
        ], function(err) {

            callback(err,null,response);

        });

    } else {

        async.waterfall([
            function(cb) {
                self.getTabIds(cb);
            },
            function(res, cb) {
                response.getTabIds = res;

                if(res && res.length) {
                    self.switchTab(res[0], cb);
                } else {
                    cb();
                }

            },
            function(res, cb) {

                if(res) {
                    response.switchTab = res;
                }

                cb();
            }
        ], function(err) {

            callback(err,null,response);

        });

    }

};