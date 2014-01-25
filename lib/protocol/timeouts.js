module.exports = function timeouts (type, ms, callback) {

    this.requestHandler.create(
        "/session/:sessionId/timeouts",
        { type: type, ms: ms },
        callback
    );
};

