module.exports = function elementIdSize (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/size".replace(/:id/gi, id),
        callback
    );

};
