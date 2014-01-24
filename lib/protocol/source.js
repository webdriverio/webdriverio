module.exports = function source (callback) {

    this.requestHandler.create(
        "/session/:sessionId/source",
        callback
    );

};
