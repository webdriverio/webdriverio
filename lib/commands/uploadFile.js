/**
 *
 * Uploads a file to to the selenium server.
 *
 * @param {String} localPath local path to file
 * @callbackParameter error
 *
 * @type utility
 *
 */

var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    archiver = require('archiver'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function uploadFile(localPath) {

    /*!
     * parameter check
     */
    if(typeof localPath !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with uploadFile command'));
    }

    var self = this,
        defer = Q.defer(),
        zipData = [],
        source = fs.createReadStream(localPath);

    archiver('zip')
        .on('error', callback)
        .on('data', function(data) {
            zipData.push(data);
        })
        .on('end', function() {
            self.file(Buffer.concat(zipData).toString('base64'), defer.resolve.bind(defer));
        })
        .append(source, {
            name: path.basename(localPath)
        })
        .finalize(function(err) {
            /* istanbul ignore next */
            if (err) {
                defer.reject(err);
            }
        });

    return defer.promise;
};