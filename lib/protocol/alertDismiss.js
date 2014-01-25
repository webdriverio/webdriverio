module.exports = function alertDismiss (callback) {

    var requestOptions = {
        path:"/session/:sessionId/dismiss_alert",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,callback);

};
