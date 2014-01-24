module.exports = function file (base64data, callback) {

    this.requestHandler.create(
        "/session/:sessionId/file",
        { file: base64data },
        callback
    );

};