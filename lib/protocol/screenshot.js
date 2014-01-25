module.exports = function screenshot (callback) {

    this.requestHandler.create(
        "/session/:sessionId/screenshot",
        callback
    );

};