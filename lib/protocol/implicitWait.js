module.exports = function implicitWait (ms, callback) {

    this.requestHandler.create(
        "/session/:sessionId/timeouts/implicit_wait",
        { ms: ms },
        callback
    );
};