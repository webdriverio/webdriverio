/**
 *
 * Uploads a file to to the selenium server.
 *
 * @param {String} localPath local path to file
 * @type utility
 *
 */

var fs = require('fs'),
    path = require('path'),
    archiver = require('archiver'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function uploadFile(localPath) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof localPath !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with uploadFile command'));
    }

    var self = this,
        zipData = [],
        source = fs.createReadStream(localPath);

    archiver('zip')
        .on('error', callback)
        .on('data', function(data) {
            zipData.push(data);
        })
        .on('end', function() {
            self.file(Buffer.concat(zipData).toString('base64'), callback);
        })
        .append(source, {
            name: path.basename(localPath)
        })
        .finalize(function(err) {
            /* istanbul ignore next */
            if (err) {
                callback(err);
            }
        });
};