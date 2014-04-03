module.exports = function saveScreenshot (fileName, callback) {

    var fs = require('fs');
    var self = this;

    this.screenshot(function(err,result) {
        if(err === null) {

            fs.writeFile(fileName, result.value, "base64", callback);

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }

    });
};

