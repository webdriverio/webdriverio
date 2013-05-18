exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/dismiss_alert",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{},callback);

};
