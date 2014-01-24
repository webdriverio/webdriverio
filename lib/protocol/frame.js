module.exports = function frame (frameId, callback) {

    if (arguments.length === 1) {
        callback = frameId;
        frameId  = null;
    }

    this.requestHandler.create(
        "/session/:sessionId/frame",
        {"id":frameId},
        callback
    );

};
