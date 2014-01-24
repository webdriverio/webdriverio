module.exports = function windowHandles (callback) {

    this.requestHandler.create(
        "/session/:sessionId/window_handles",
        callback
    );

};