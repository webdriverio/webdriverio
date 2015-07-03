/**
 *
 * Uploads a base64 data object.
 *
 * @param {Object} data base64 data object
 *
 * @type protocol
 *
 */

module.exports = function file (base64data) {

    var requestPath = '/session/:sessionId/file';

    return this.requestHandler.create(
        requestPath,
        { file: base64data }
    );

};