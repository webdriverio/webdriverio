module.exports = function elementIdDisplayed (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/displayed".replace(/:id/gi, id),
        callback
    );

};
