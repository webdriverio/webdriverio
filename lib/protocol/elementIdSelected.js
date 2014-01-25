module.exports = function elementIdSelected (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/selected".replace(/:id/gi, id),
        callback
    );

};
