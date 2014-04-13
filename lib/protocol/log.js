module.exports = function log (callback) {

    var requestOptions = {
        path: '/session/:sessionId/log',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions,callback);

};
