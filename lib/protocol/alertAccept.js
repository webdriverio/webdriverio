module.exports = function alertAccept (callback) {

    var requestOptions = {
        path:"/session/:sessionId/accept_alert",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,callback);

};
