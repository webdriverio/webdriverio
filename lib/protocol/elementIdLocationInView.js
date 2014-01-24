module.exports = function elementIdLocationInView (id, callback) {

    this.requestHandler.create(
        "/session/:sessionId/element/:id/location_in_view".replace(/:id/gi, id),
        callback
    );

};
