module.exports = function elementIdLocation (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/location".replace(/:id/gi, id),
        callback
    );

};
