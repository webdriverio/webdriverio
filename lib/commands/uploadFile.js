module.exports = function uploadFile(localPath, cb) {
    var fs = require('fs');
    var client = this;

    var path = require('path');
    var archiver = require('archiver');

    var zipData = [];

    var source = fs.createReadStream(localPath);

    archiver('zip')
        .on('error', cb)
        .on('data', function(data) {
            zipData.push(data);
        })
        .on('end', function() {
            client.file(Buffer.concat(zipData).toString('base64'), cb);
        })
        .append(source, {
            name: path.basename(localPath)
        })
        .finalize(function(err) {
            /* istanbul ignore next */
            if (err) {
                cb(err);
            }
        });
}