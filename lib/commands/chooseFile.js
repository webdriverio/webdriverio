module.exports = function chooseFile(selector, localPath, cb) {
    var fs = require('fs');
    var client = this;

    fs.exists(localPath, function(exists) {
        if (!exists) {
            return cb(new Error('File to upload does not exists on your system'));
        }

        client.uploadFile(localPath, function(err, res) {
            /* istanbul ignore next */
            if (err) {
                return cb(err);
            }

            client.addValue(selector,  res.value, cb);
        });
    });
}