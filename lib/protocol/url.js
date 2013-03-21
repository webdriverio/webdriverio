exports.command = function (url, callback) {

    var commandOptionsPost = {
        path:"/session/:sessionId/url",
        method:"POST"
    };

    var commandOptionsGet = {
        path:"/session/:sessionId/url",
        method:"GET"
    };

    // set or get
    if (typeof url === "string") {

        this.executeProtocolCommand(
            commandOptionsPost,
            this.proxyResponseNoReturn(callback),
            {"url":url}
        );

    } else {

        this.executeProtocolCommand(
            commandOptionsGet,
            this.proxyResponse(url),
            {}
        );

    }
};

