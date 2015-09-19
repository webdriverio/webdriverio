/**
 *
 * Uploads a base64 data object.
 *
 * @param {Object} data base64 data object
 *
 * @type protocol
 *
 */

let file = function (base64data) {
    return this.requestHandler.create('/session/:sessionId/file', {
        file: base64data
    })
}

export default file
