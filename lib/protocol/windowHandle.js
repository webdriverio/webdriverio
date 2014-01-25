module.exports = function windowHandle (callback) {

    this.requestHandler.create(
        "/session/:sessionId/window_handle",
        callback
    );

};