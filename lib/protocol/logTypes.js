module.exports = function logTypes (callback) {

    this.requestHandler.create(
        '/session/:sessionId/log/types',
        callback
    );

};