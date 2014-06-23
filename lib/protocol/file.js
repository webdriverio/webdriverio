/**
 *
 * Uploads a base64 data object.
 *
 * @param {Object} data base64 data object
 * @type protocol
 *
 */

module.exports = function file (base64data) {

    this.requestHandler.create(
        '/session/:sessionId/file',
        { file: base64data },
        arguments[arguments.length - 1]
    );

};