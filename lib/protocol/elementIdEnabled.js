module.exports = function elementIdEnabled (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/enabled".replace(/:id/gi, id),
        callback
    );

};
