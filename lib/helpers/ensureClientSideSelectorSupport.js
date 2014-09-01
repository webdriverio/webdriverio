var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js'),
    fs = require('fs'),
    wgxpathSrcPath = require.resolve('wgxpath'),
    wgxpathSrc;

// Ensures document.evaluate() in the browser.
module.exports = function() {
    var self = this,
        callback = arguments[arguments.length - 1],
        response = {};

    async.waterfall([
        function(cb) {
            self.execute('return !!document.evaluate;', cb);
        },
        function(res, cb) {
            if (res.value) {
                response.executeCheck = res;
                cb();
            } else {
                async.waterfall([
                    function(cb2) {
                        // Don't read in unless necessary...
                        if (!wgxpathSrc) {
                            fs.readFile(wgxpathSrcPath, cb2);
                        } else {
                            cb2();
                        }
                    },
                    function(res) {
                        if (res && typeof res === 'object') {
                            // This should remove the module.exports footer...
                            wgxpathSrc = res.toString().split('module.exports')[0];
                        }
                        self.execute(wgxpathSrc + "\nwgxpath.install(window);", arguments[arguments.length - 1]);
                    },
                    function(res, cb2) {
                        response.executeInstall = res;
                        cb2();
                    }
                ], cb);
            }
        }
    ], function(err) {
        callback(err, response);
    });
};