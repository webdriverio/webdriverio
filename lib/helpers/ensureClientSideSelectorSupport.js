var fs = require('fs'),
    Q = require('q'),
    wgxpathSrcPath = require.resolve('wgxpath'),
    wgxpathSrc;

/**
 * Ensures document.evaluate() in the browser.
 */
module.exports = function () {
    return this.execute('return !!document.evaluate;').then(function (res) {

        if (res.value) {
            return true;
        }

        /**
         * Don't read in unless necessary
         */
        if (wgxpathSrc) {
            return this.execute(wgxpathSrc + '\nwgxpath.install(window);');
        }

        var self = this;
        return Q.nfcall(fs.readFile, wgxpathSrcPath).then(function (res) {

            /**
             * remove the module.exports footer
             */
            if (res && typeof res === 'object') {
                wgxpathSrc = res.toString().split('module.exports')[0];
            }

            return self.execute(wgxpathSrc + '\nwgxpath.install(window);');

        });

    });

};