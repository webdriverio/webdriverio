module.exports = function elementIdText (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/text".replace(/:id/gi, id),
        callback
    );

};
