module.exports = function close (newTabID, callback) {

    var self = this;
    this.window(function(err, result) {

        if(err === null) {

            if(typeof newTabID === 'function') {

                callback = newTabID;

                // no new tab handle given so get all tab handles and switch to the first tab
                this.getTabIds(function(err,res) {

                    if(err === null && res) {

                        this.tabs = res;
                        this.switchTab(res[0], function(err,res) {

                            if(err === null && (typeof callback === 'function')) {

                                callback(err,{
                                    activeTab: this.tabs[0],
                                    openTabs: this.tabs
                                });

                            } else if(typeof callback === 'function') {

                                /* istanbul ignore next */
                                callback(err);

                            }

                        });

                    } else if(typeof callback === 'function') {

                        // there are no open tabs
                        callback(null, {
                            activeTab: undefined,
                            openTabs: []
                        });

                    }

                });

            } else {

                this.switchTab(newTabID,callback);

            }

        } else {

            callback(err, result);

        }
    });
};