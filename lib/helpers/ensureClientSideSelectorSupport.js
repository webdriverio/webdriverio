var ErrorHandler = require('../utils/ErrorHandler.js'),
    fs = require('fs'),
    Q = require('q'),
    wgxpathSrcPath = require.resolve('wgxpath'),
    wgxpathSrc;

// Ensures document.evaluate() in the browser.
module.exports = function () {
    var self = this,
        response = {};

    return self.execute('return !!document.evaluate;')
        .then(function (res) {
            if (res.value) {
                response.executeCheck = res;
            } else {
                if (!wgxpathSrc) {
                    return Q.nfcall(fs.readFile, wgxpathSrcPath)
                        .then(function (res) {
                            if (res && typeof res === 'object') {
                                // This should remove the module.exports footer...
                                wgxpathSrc = res.toString().split('module.exports')[0];
                            }
                            return self.execute(wgxpathSrc + "\nwgxpath.install(window);");
                        })
                        .then(function (res) {
                            response.executeInstall = res;
                        });
                }
            }
        });
};