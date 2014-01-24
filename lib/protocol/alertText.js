module.exports = function alertText (callback) {

    this.requestHandler.create("/session/:sessionId/alert_text",callback);

};
