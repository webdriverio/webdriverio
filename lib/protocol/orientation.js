module.exports = function orientation (deviceOrientation, callback) {
    var data = {};
    if (typeof deviceOrientation === 'string') {
        data.orientation = deviceOrientation;
    } else {
        callback = deviceOrientation;
    }

    this.requestHandler.create(
        '/session/:sessionId/orientation',
        data,
        callback
    );
};

