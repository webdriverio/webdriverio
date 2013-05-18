exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/accept_alert",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{},callback);

};
