module.exports = function applicationCacheStatus (callback) {

    this.requestHandler.create(
        '/session/:sessionId/application_cache/status',
        callback
    );

};
