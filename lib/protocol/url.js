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

        // this.executeProtocolCommand(
        //     commandOptionsPost,
        //     this.proxyResponseNoReturn(callback),
        //     {"url":url}
        // );

        this.requestHandler.create(
            commandOptionsPost,
            {"url":url},
            callback
        );

    } else {

        this.requestHandler.create(
            commandOptionsGet,
            url
        );

        // this.executeProtocolCommand(
        //     commandOptionsGet,
        //     this.proxyResponse(url),
        //     {}
        // );

    }
};

