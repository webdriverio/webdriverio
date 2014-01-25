module.exports = function elementIdName (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/name".replace(/:id/gi, id),
        callback
    );
};
