module.exports = function orientation (orientation, callback) {
    var data = {};
    if (typeof orientation === "string") {
        data.orientation = orientation;
    }

    this.requestHandler.create(
        "/session/:sessionId/orientation",
        data,
        callback
    );
};

